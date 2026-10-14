import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ScanLine } from "lucide-react";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS, formatOrderNumber, type OrderStatusValue } from "@/lib/settings";
import { SmartImage } from "@/components/ui/SmartImage";
import { Button } from "@/components/ui/Button";
import { OrderActions } from "@/components/admin/OrderActions";
import { OrderStatusPill, PageHeader, Panel, PaymentPill } from "@/components/admin/ui";

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      customer: { include: { _count: { select: { orders: true } } } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();
  const status = order.status as OrderStatusValue;
  const scanned = order.items.reduce((a, i) => a + i.scannedQty, 0);
  const units = order.items.reduce((a, i) => a + i.quantity, 0);

  return (
    <div className="print:text-black">
      <PageHeader
        back={<Link href="/admin/orders" className="mt-1.5 p-1.5 text-asur-silver hover:text-asur-white print:hidden" aria-label="Back to orders"><ArrowLeft size={18} /></Link>}
        title={formatOrderNumber(order.number)}
        subtitle={
          <span className="flex flex-wrap items-center gap-3">
            <OrderStatusPill status={status} label={ORDER_STATUS_LABEL[status]} />
            <PaymentPill status={order.paymentStatus} />
            <span>{order.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
          </span>
        }
        actions={
          (status === "confirmed" || status === "processing") && (
            <Link href={`/admin/dispatch/${order.id}`}>
              <Button size="sm"><span className="flex items-center gap-2"><ScanLine size={14} /> Pack &amp; scan</span></Button>
            </Link>
          )
        }
      />

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Panel title={`Items (${units})`} action={<span className="text-caption text-asur-slate">Scanned {scanned}/{units}</span>}>
            <ul className="-my-3 divide-y divide-asur-graphite">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <div className="relative w-12 h-14 shrink-0 bg-asur-graphite overflow-hidden">
                    {i.image && <SmartImage src={i.image} alt="" fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {i.variantId ? (
                      <p className="text-body-sm text-asur-white truncate">{i.productName}</p>
                    ) : (
                      <p className="text-body-sm text-asur-white truncate">{i.productName} <span className="text-caption text-asur-slate">(deleted)</span></p>
                    )}
                    <p className="flex items-center gap-1.5 text-caption text-asur-silver">
                      <span className="w-2.5 h-2.5 rounded-full border border-asur-iron" style={{ background: i.colorHex }} />
                      {i.colorName} / {i.size} · <span className="font-mono">{i.sku}</span>
                    </p>
                  </div>
                  <p className="text-body-sm text-asur-silver whitespace-nowrap">{i.quantity} × {formatPrice(i.unitPrice)}</p>
                  <p className="w-24 text-right text-body-sm text-asur-white">{formatPrice(i.total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 pt-4 border-t border-asur-graphite space-y-1.5 text-body-sm max-w-xs ml-auto">
              <div className="flex justify-between"><dt className="text-asur-silver">Subtotal</dt><dd className="text-asur-white">{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-asur-silver">Shipping</dt><dd className="text-asur-white">{order.shippingFee ? formatPrice(order.shippingFee) : "Free"}</dd></div>
              <div className="flex justify-between pt-2 border-t border-asur-graphite"><dt className="text-asur-white font-medium">Total</dt><dd className="text-asur-white font-medium">{formatPrice(order.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-asur-slate">Collect on delivery</dt><dd className="text-asur-slate">{order.paymentStatus === "pending" ? formatPrice(order.total) : "—"}</dd></div>
            </dl>
          </Panel>

          <Panel title="Timeline">
            <ol className="space-y-4">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.type === "note" ? "bg-accent-primary" : e.type === "payment" ? "bg-status-success" : "bg-asur-silver"}`} />
                  <div>
                    <p className="text-body-sm text-asur-white">{e.message}</p>
                    <p className="text-caption text-asur-slate">{e.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <OrderActions
            orderId={order.id}
            status={status}
            next={ORDER_TRANSITIONS[status]}
            paymentStatus={order.paymentStatus}
            allScanned={scanned === units}
          />

          <Panel title="Customer">
            <p className="text-body-sm text-asur-white">{order.customer.name}</p>
            <a href={`mailto:${order.customer.email}`} className="block text-body-sm text-accent-primary hover:underline">{order.customer.email}</a>
            <a href={`tel:${order.shipPhone}`} className="block text-body-sm text-asur-silver hover:text-asur-white">{order.shipPhone}</a>
            <Link href={`/admin/orders?q=${encodeURIComponent(order.customer.email)}`} className="mt-3 inline-block text-caption text-asur-slate hover:text-asur-white">
              {order.customer._count.orders} order{order.customer._count.orders === 1 ? "" : "s"} from this customer →
            </Link>
          </Panel>

          <Panel title="Ship to">
            <p className="text-body-sm leading-relaxed text-asur-ash">
              {order.shipName}<br />{order.shipAddress}{order.shipArea ? `, ${order.shipArea}` : ""}<br />{order.shipCity}<br />{order.shipPhone}
            </p>
            {order.shipNotes && <p className="mt-3 p-3 bg-asur-graphite text-caption text-asur-silver">“{order.shipNotes}”</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
