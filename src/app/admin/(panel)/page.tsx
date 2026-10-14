import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Banknote, Clock, PackageCheck, ShoppingCart, Truck, Warehouse } from "lucide-react";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, formatOrderNumber, type OrderStatusValue } from "@/lib/settings";
import { EmptyState, OrderStatusPill, PageHeader, Panel } from "@/components/admin/ui";

const COUNTED = { notIn: ["cancelled", "returned"] };

export default async function AdminDashboard() {
  await requireAdmin();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days30 = new Date(now.getTime() - 30 * 86_400_000);
  const days60 = new Date(now.getTime() - 60 * 86_400_000);

  const [today, last30, prev30, statusCounts, recent, variants, topItems] = await Promise.all([
    db.order.aggregate({ where: { createdAt: { gte: startOfToday }, status: COUNTED }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { createdAt: { gte: days30 }, status: COUNTED }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { createdAt: { gte: days60, lt: days30 }, status: COUNTED }, _sum: { total: true } }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.variant.findMany({ include: { product: { select: { name: true, id: true } } } }),
    db.orderItem.groupBy({
      by: ["productName"],
      where: { order: { createdAt: { gte: days30 }, status: COUNTED } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const count = (s: string) => statusCounts.find((c) => c.status === s)?._count ?? 0;
  const revenue30 = last30._sum.total ?? 0;
  const prevRevenue = prev30._sum.total ?? 0;
  const change = prevRevenue ? Math.round(((revenue30 - prevRevenue) / prevRevenue) * 100) : null;
  const low = variants.filter((v) => v.stock <= v.lowStockThreshold).sort((a, b) => a.stock - b.stock);
  const stockValue = variants.reduce((a, v) => a + v.stock * v.costPrice, 0);
  const aov = last30._count ? Math.round(revenue30 / last30._count) : 0;

  const metrics = [
    { label: "Revenue · 30 days", value: formatPrice(revenue30), sub: change === null ? "No previous period" : `${change >= 0 ? "+" : ""}${change}% vs previous 30 days`, icon: Banknote, tone: change !== null && change < 0 ? "text-status-error" : "text-status-success" },
    { label: "Orders today", value: String(today._count), sub: `${formatPrice(today._sum.total ?? 0)} revenue`, icon: ShoppingCart, tone: "text-status-info" },
    { label: "Awaiting confirmation", value: String(count("pending")), sub: "Call to confirm", icon: Clock, tone: "text-status-warning", href: "/admin/orders?status=pending" },
    { label: "To pack", value: String(count("confirmed") + count("processing")), sub: `${count("ready_for_dispatch")} packed, awaiting pickup`, icon: PackageCheck, tone: "text-accent-primary", href: "/admin/dispatch" },
    { label: "Out for delivery", value: String(count("dispatched")), sub: `${count("delivered")} delivered all-time`, icon: Truck, tone: "text-accent-primary", href: "/admin/orders?status=dispatched" },
    { label: "Stock value", value: formatPrice(stockValue), sub: `${low.length} variants low or sold out`, icon: Warehouse, tone: low.length ? "text-status-warning" : "text-status-success", href: "/admin/inventory?filter=low" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · Avg. order ${formatPrice(aov)}`} />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {metrics.map((m) => {
          const Icon = m.icon;
          const body = (
            <div className={cn("h-full bg-asur-carbon border border-asur-graphite p-5 transition-colors", m.href && "hover:border-asur-iron")}>
              <div className="flex items-center justify-between">
                <p className="text-caption text-asur-slate uppercase tracking-wider">{m.label}</p>
                <Icon size={16} className={m.tone} />
              </div>
              <p className="mt-3 text-heading-lg font-bold text-asur-white">{m.value}</p>
              <p className={cn("mt-1 text-caption", m.tone)}>{m.sub}</p>
            </div>
          );
          return m.href ? <Link key={m.label} href={m.href}>{body}</Link> : <div key={m.label}>{body}</div>;
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Panel
          title="Recent orders"
          className="xl:col-span-2"
          action={<Link href="/admin/orders" className="flex items-center gap-1 text-caption text-asur-silver hover:text-asur-white">View all <ArrowUpRight size={12} /></Link>}
        >
          {recent.length === 0 ? (
            <EmptyState icon={<ShoppingCart size={32} />} title="No orders yet">Orders from the storefront show up here instantly.</EmptyState>
          ) : (
            <ul className="-my-3 divide-y divide-asur-graphite">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 py-3 hover:bg-asur-steel/10 -mx-2 px-2">
                    <span className="font-mono text-body-sm text-asur-white w-20">{formatOrderNumber(o.number)}</span>
                    <span className="flex-1 min-w-0 truncate text-body-sm text-asur-silver">{o.shipName} · {o.shipCity}</span>
                    <span className="text-body-sm text-asur-white">{formatPrice(o.total)}</span>
                    <OrderStatusPill status={o.status} label={ORDER_STATUS_LABEL[o.status as OrderStatusValue]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Best sellers · 30 days">
            {topItems.length === 0 ? (
              <p className="text-body-sm text-asur-slate">No sales yet.</p>
            ) : (
              <ol className="space-y-3">
                {topItems.map((t, i) => (
                  <li key={t.productName} className="flex items-center gap-3 text-body-sm">
                    <span className="font-mono text-caption text-asur-slate w-4">{i + 1}</span>
                    <span className="flex-1 truncate text-asur-white">{t.productName}</span>
                    <span className="text-asur-silver">{t._sum.quantity} sold</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel
            title={<span className="flex items-center gap-2"><AlertTriangle size={15} className="text-status-warning" /> Low stock</span>}
            action={<Link href="/admin/inventory?filter=low" className="text-caption text-asur-silver hover:text-asur-white">Restock</Link>}
          >
            {low.length === 0 ? (
              <p className="text-body-sm text-asur-slate">Everything is well stocked.</p>
            ) : (
              <ul className="space-y-2">
                {low.slice(0, 6).map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 text-body-sm">
                    <span className="truncate text-asur-silver">{v.product.name} <span className="text-asur-slate">· {v.colorName} / {v.size}</span></span>
                    <span className={cn("font-semibold tabular-nums", v.stock <= 0 ? "text-status-error" : "text-status-warning")}>{v.stock}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
