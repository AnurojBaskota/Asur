import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Package, Truck, Home, Banknote } from "lucide-react";
import { db } from "@/lib/server/db";
import { getSettings } from "@/lib/server/settings";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, formatOrderNumber, type OrderStatusValue } from "@/lib/settings";
import { SmartImage } from "@/components/ui/SmartImage";
import { Footer } from "@/components/storefront/Sections";

export const metadata: Metadata = { title: "Your order | ASUR", robots: { index: false } };

const STEPS = [
  { key: "pending", label: "Placed", icon: Check, done: ["pending", "confirmed", "processing", "ready_for_dispatch", "dispatched", "delivered"] },
  { key: "processing", label: "Packing", icon: Package, done: ["processing", "ready_for_dispatch", "dispatched", "delivered"] },
  { key: "dispatched", label: "On the way", icon: Truck, done: ["dispatched", "delivered"] },
  { key: "delivered", label: "Delivered", icon: Home, done: ["delivered"] },
];

export default async function OrderPage({ params }: PageProps<"/order/[token]">) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();

  const [order, settings] = await Promise.all([
    db.order.findUnique({ where: { publicToken: token }, include: { items: true, customer: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  const status = order.status as OrderStatusValue;
  const stopped = status === "cancelled" || status === "returned";

  return (
    <>
      <div className="pt-[136px] pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <span className={cn("inline-flex h-14 w-14 items-center justify-center rounded-full", stopped ? "bg-status-error/15 text-status-error" : "bg-accent-primary/15 text-accent-primary")}>
              <Check size={26} />
            </span>
            <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.16em] text-accent-primary">Order {formatOrderNumber(order.number)}</p>
            <h1 className="mt-2 font-display condensed font-black uppercase text-asur-white leading-[0.88] text-[clamp(3rem,7vw,5.5rem)]">
              {stopped ? `Order ${ORDER_STATUS_LABEL[status].toLowerCase()}` : `Thank you, ${order.shipName.split(" ")[0]}`}
            </h1>
            {!stopped && (
              <p className="mt-4 text-[15px] text-asur-ash max-w-lg mx-auto">
                We&apos;ve received your order. We&apos;ll call {order.shipPhone} to confirm, then deliver in {settings.shipping.deliveryDays}. Keep this page&apos;s link to check your order status.
              </p>
            )}
          </div>

          {!stopped && (
            <ol className="mt-12 grid grid-cols-4 gap-2">
              {STEPS.map((s) => {
                const done = s.done.includes(status);
                const Icon = s.icon;
                return (
                  <li key={s.key} className="text-center">
                    <div className={cn("h-1 mb-4", done ? "bg-accent-primary" : "bg-asur-graphite")} />
                    <Icon size={18} className={cn("mx-auto", done ? "text-asur-white" : "text-asur-iron")} />
                    <p className={cn("mt-2 text-[12px] uppercase tracking-[0.1em]", done ? "text-asur-white" : "text-asur-slate")}>{s.label}</p>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-14 grid md:grid-cols-5 gap-8">
            <section className="md:col-span-3 bg-asur-carbon border border-asur-graphite p-6">
              <h2 className="font-display condensed font-black uppercase text-2xl text-asur-white">Items</h2>
              <ul className="mt-4 divide-y divide-asur-graphite">
                {order.items.map((i) => (
                  <li key={i.id} className="flex gap-4 py-4">
                    <div className="relative w-16 aspect-[4/5] shrink-0 bg-asur-graphite overflow-hidden">
                      {i.image && <SmartImage src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-asur-white">{i.productName.replace(/^ASUR\s+/i, "")}</p>
                      <p className="text-[12px] text-asur-slate">{i.colorName} · {i.size} · Qty {i.quantity}</p>
                    </div>
                    <p className="text-[14px] text-asur-white">{formatPrice(i.total)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-2 pt-4 border-t border-asur-graphite space-y-2 text-[14px]">
                <div className="flex justify-between"><dt className="text-asur-silver">Subtotal</dt><dd className="text-asur-white">{formatPrice(order.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-asur-silver">Shipping</dt><dd className="text-asur-white">{order.shippingFee ? formatPrice(order.shippingFee) : "Free"}</dd></div>
                <div className="flex justify-between pt-3 border-t border-asur-graphite text-base"><dt className="text-asur-white font-medium">Total</dt><dd className="text-asur-white font-medium">{formatPrice(order.total)}</dd></div>
              </dl>
            </section>

            <section className="md:col-span-2 space-y-6">
              <div className="bg-asur-carbon border border-asur-graphite p-6">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-asur-slate">Status</h2>
                <p className="mt-2 text-[15px] text-asur-white">{ORDER_STATUS_LABEL[status]}</p>
              </div>
              <div className="bg-asur-carbon border border-asur-graphite p-6">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-asur-slate">Delivering to</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-asur-ash">
                  {order.shipName}<br />
                  {order.shipAddress}{order.shipArea ? `, ${order.shipArea}` : ""}<br />
                  {order.shipCity}<br />
                  {order.shipPhone}
                </p>
              </div>
              <div className="bg-asur-carbon border border-asur-graphite p-6">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-asur-slate">Payment</h2>
                <p className="mt-2 flex items-center gap-2 text-[14px] text-asur-ash"><Banknote size={16} className="text-accent-primary" /> Cash on Delivery — {formatPrice(order.total)}</p>
              </div>
            </section>
          </div>

          <div className="mt-12 text-center">
            <Link href="/shop" className="inline-flex items-center h-12 px-6 bg-asur-bone text-asur-black text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
