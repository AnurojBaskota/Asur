import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search, ShoppingCart } from "lucide-react";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, formatOrderNumber, type OrderStatusValue } from "@/lib/settings";
import { EmptyState, OrderStatusPill, PageHeader, PaymentPill, fieldClass } from "@/components/admin/ui";

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (ORDER_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (q) {
    const num = Number(q.replace(/^AS-?/i, ""));
    where.OR = [
      ...(Number.isInteger(num) && num > 0 ? [{ number: num }] : []),
      { shipName: { contains: q } },
      { shipPhone: { contains: q } },
      { customer: { email: { contains: q.toLowerCase() } } },
    ];
  }

  const [orders, counts] = await Promise.all([
    db.order.findMany({
      where,
      include: { customer: true, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((a, c) => a + c._count, 0);

  const tab = (value: string, label: string, n: number) => (
    <Link
      key={value || "all"}
      href={value ? `/admin/orders?status=${value}` : "/admin/orders"}
      className={cn(
        "shrink-0 px-3 h-9 inline-flex items-center gap-2 border text-body-sm transition-colors",
        status === value ? "border-asur-white text-asur-white" : "border-asur-graphite text-asur-silver hover:text-asur-white"
      )}
    >
      {label} <span className="text-caption text-asur-slate">{n}</span>
    </Link>
  );

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${total} orders · ${countOf("pending")} awaiting confirmation`} />

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {tab("", "All", total)}
        {ORDER_STATUSES.map((s) => tab(s, ORDER_STATUS_LABEL[s], countOf(s)))}
      </div>

      <form className="relative max-w-md mb-4">
        {status && <input type="hidden" name="status" value={status} />}
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-asur-slate" />
        <input name="q" defaultValue={q} placeholder="Search order no., name, phone, email…" className={cn(fieldClass, "pl-9")} />
      </form>

      <div className="bg-asur-carbon border border-asur-graphite overflow-x-auto">
        {orders.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={36} />} title={total ? "No orders match" : "No orders yet"}>
            {!total && "Orders placed on the storefront will appear here."}
          </EmptyState>
        ) : (
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-asur-graphite text-left text-caption text-asur-slate uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-asur-graphite/50 last:border-0 hover:bg-asur-steel/10">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-body-sm text-asur-white hover:text-accent-primary">
                      {formatOrderNumber(o.number)}
                    </Link>
                    <p className="text-caption text-asur-slate">{o.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-body-sm text-asur-white">{o.shipName}</p>
                    <p className="text-caption text-asur-slate">{o.shipCity} · {o.shipPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-asur-silver">{o._count.items}</td>
                  <td className="px-4 py-3 text-body-sm text-asur-white">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3"><PaymentPill status={o.paymentStatus} /><p className="text-caption text-asur-slate uppercase">{o.paymentMethod}</p></td>
                  <td className="px-5 py-3"><OrderStatusPill status={o.status} label={ORDER_STATUS_LABEL[o.status as OrderStatusValue]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
