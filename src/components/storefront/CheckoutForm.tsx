"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { shippingFor, type StoreSettings } from "@/lib/settings";
import { SmartImage } from "@/components/ui/SmartImage";
import { placeOrder, type CheckoutInput } from "@/app/(storefront)/actions";
import { useCartSync } from "./useCartSync";

const subscribeNoop = () => () => {};

type Fields = Omit<CheckoutInput, "items">;
const EMPTY: Fields = { name: "", email: "", phone: "", address: "", city: "", area: "", notes: "" };

export function CheckoutForm({ shipping }: { shipping: StoreSettings["shipping"] }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const syncing = useCartSync(hydrated);

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [error, setError] = useState<{ message: string; field?: keyof CheckoutInput } | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = items.reduce((a, i) => a + (i.variant.salePrice || i.variant.price) * i.quantity, 0);
  const fee = shippingFor(subtotal, shipping);
  const total = subtotal + fee;

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({ ...fields, items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) });
      if (!res.ok) {
        setError({ message: res.error, field: res.field });
        if (res.field) document.getElementById(`co-${res.field}`)?.focus();
        return;
      }
      clearCart();
      router.replace(`/order/${res.token}`);
    });
  };

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-display condensed font-black uppercase text-5xl text-asur-white">Your bag is empty</h1>
        <p className="mt-3 text-[15px] text-asur-slate">Add something you like, then come back to check out.</p>
        <Link href="/shop" className="mt-8 inline-flex items-center h-12 px-6 bg-asur-bone text-asur-black text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white">
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid lg:grid-cols-12 gap-10 lg:gap-16">
      <div className="lg:col-span-7 space-y-10">
        <Link href="/shop" className="inline-flex items-center gap-2 text-[13px] text-asur-silver hover:text-asur-white">
          <ArrowLeft size={15} /> Continue shopping
        </Link>

        <Section n="01" title="Contact">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="name" label="Full name" value={fields.name} onChange={set("name")} autoComplete="name" error={error} className="sm:col-span-2" />
            <Field id="email" label="Email" type="email" value={fields.email} onChange={set("email")} autoComplete="email" error={error} hint="For your order confirmation" />
            <Field id="phone" label="Phone" type="tel" value={fields.phone} onChange={set("phone")} autoComplete="tel" error={error} hint="Our rider will call this number" placeholder="98XXXXXXXX" />
          </div>
        </Section>

        <Section n="02" title="Delivery address">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="address" label="Street address" value={fields.address} onChange={set("address")} autoComplete="street-address" error={error} className="sm:col-span-2" placeholder="House no., street, tole" />
            <Field id="area" label="Area / landmark (optional)" value={fields.area} onChange={set("area")} error={error} placeholder="Near…" />
            <Field id="city" label="City" value={fields.city} onChange={set("city")} autoComplete="address-level2" error={error} placeholder="Kathmandu" />
            <div className="sm:col-span-2">
              <label htmlFor="co-notes" className="block text-[12px] font-medium uppercase tracking-[0.1em] text-asur-silver mb-2">Delivery notes (optional)</label>
              <textarea
                id="co-notes"
                rows={2}
                value={fields.notes}
                onChange={set("notes")}
                maxLength={500}
                className="w-full bg-transparent border border-asur-iron px-4 py-3 text-[15px] text-asur-white placeholder:text-asur-slate focus:outline-none focus:border-asur-white resize-none"
                placeholder="Best time to call, gate code…"
              />
            </div>
          </div>
        </Section>

        <Section n="03" title="Payment">
          <div className="flex items-start gap-4 border border-asur-white p-5">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-[5px] border-asur-white" aria-hidden />
            <div className="flex-1">
              <p className="flex items-center gap-2 text-[15px] font-medium text-asur-white"><Banknote size={18} className="text-accent-primary" /> Cash on Delivery</p>
              <p className="mt-1 text-[13px] text-asur-silver">Pay in cash when your order arrives. Delivery in {shipping.deliveryDays}.</p>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-asur-slate">Online payments (eSewa, Khalti) coming soon.</p>
        </Section>
      </div>

      {/* Summary */}
      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-[128px] bg-asur-carbon border border-asur-graphite p-6 sm:p-8">
          <h2 className="font-display condensed font-black uppercase text-3xl text-asur-white">Order summary</h2>
          <ul className="mt-6 divide-y divide-asur-graphite max-h-[40vh] overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.variantId} className="flex gap-4 py-4">
                <div className="relative w-16 aspect-[4/5] shrink-0 bg-asur-graphite overflow-hidden">
                  {i.product.images[0] && <SmartImage src={i.product.images[0].url} alt="" fill sizes="64px" className="object-cover" />}
                  <span className="absolute -top-0 -right-0 min-w-5 h-5 px-1 bg-asur-bone text-asur-black text-[11px] font-bold flex items-center justify-center">{i.quantity}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-asur-white leading-snug">{i.product.name.replace(/^ASUR\s+/i, "")}</p>
                  <p className="text-[12px] text-asur-slate mt-0.5">{i.variant.color.name} · {i.variant.size}</p>
                </div>
                <p className="text-[14px] text-asur-white whitespace-nowrap">{formatPrice((i.variant.salePrice || i.variant.price) * i.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 pt-4 border-t border-asur-graphite space-y-2.5 text-[14px]">
            <div className="flex justify-between"><dt className="text-asur-silver">Subtotal</dt><dd className="text-asur-white">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-asur-silver">Shipping</dt>
              <dd className={fee === 0 ? "text-status-success" : "text-asur-white"}>{fee === 0 ? "Free" : formatPrice(fee)}</dd>
            </div>
            {fee > 0 && (
              <p className="text-[12px] text-asur-slate">Add {formatPrice(shipping.freeThreshold - subtotal)} more for free shipping.</p>
            )}
            <div className="flex justify-between items-baseline pt-4 border-t border-asur-graphite">
              <dt className="text-asur-white font-medium">Total</dt>
              <dd className="text-2xl font-medium text-asur-white">{formatPrice(total)}</dd>
            </div>
          </dl>

          {error && !error.field && <p role="alert" className="mt-5 p-3 border border-status-error/40 bg-status-error/10 text-[13px] text-status-error">{error.message}</p>}

          <button
            type="submit"
            disabled={pending || syncing}
            className="mt-6 w-full h-14 flex items-center justify-center gap-2 bg-asur-bone text-asur-black text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white transition-colors disabled:opacity-60"
          >
            {pending ? <><Loader2 size={16} className="animate-spin" /> Placing order…</> : <><Lock size={14} /> Place order — {formatPrice(total)}</>}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-asur-slate">
            <ShieldCheck size={14} /> {shipping.returnDays}-day returns · {shipping.returnConditions.toLowerCase()}
          </p>
        </div>
      </aside>
    </form>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-baseline gap-3 mb-5">
        <span className="font-mono text-[12px] text-accent-primary">{n}</span>
        <span className="font-display condensed font-black uppercase text-3xl text-asur-white">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: {
  id: keyof Fields;
  label: string;
  error: { message: string; field?: keyof CheckoutInput } | null;
  hint?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const invalid = error?.field === id;
  return (
    <div className={className}>
      <label htmlFor={`co-${id}`} className="block text-[12px] font-medium uppercase tracking-[0.1em] text-asur-silver mb-2">{label}</label>
      <input
        id={`co-${id}`}
        aria-invalid={invalid}
        aria-describedby={invalid ? `co-${id}-err` : undefined}
        className={cn(
          "w-full h-12 bg-transparent border px-4 text-[15px] text-asur-white placeholder:text-asur-slate focus:outline-none transition-colors",
          invalid ? "border-status-error" : "border-asur-iron focus:border-asur-white"
        )}
        {...props}
      />
      {invalid ? (
        <p id={`co-${id}-err`} className="mt-1.5 text-[12px] text-status-error">{error!.message}</p>
      ) : (
        hint && <p className="mt-1.5 text-[12px] text-asur-slate">{hint}</p>
      )}
    </div>
  );
}
