"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/format";
import { SmartImage } from "@/components/ui/SmartImage";
import { useCartSync } from "./useCartSync";

export function CartDrawer({ freeShippingAt }: { freeShippingAt: number }) {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore();
  useCartSync(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const remaining = Math.max(0, freeShippingAt - subtotal);
  const progress = freeShippingAt > 0 ? Math.min(100, (subtotal / freeShippingAt) * 100) : 100;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={closeCart} />

      <div className="absolute inset-y-0 right-0 w-full max-w-[440px] bg-asur-carbon border-l border-asur-graphite flex flex-col animate-[slideInRight_.35s_cubic-bezier(.2,.7,.2,1)]">
        <div className="flex items-center justify-between px-6 h-16 border-b border-asur-graphite">
          <h2 className="font-display condensed font-black uppercase text-2xl text-asur-white">
            Your bag <span className="text-asur-slate">({getItemCount()})</span>
          </h2>
          <button onClick={closeCart} className="p-2 -mr-2 text-asur-silver hover:text-asur-white" aria-label="Close bag">
            <X size={20} />
          </button>
        </div>

        {items.length > 0 && (
          <div className="px-6 py-4 border-b border-asur-graphite">
            <p className="text-[13px] text-asur-ash">
              {remaining > 0 ? (
                <>You&apos;re <span className="text-asur-white font-medium">{formatPrice(remaining)}</span> away from free shipping</>
              ) : (
                <span className="text-status-success">You&apos;ve unlocked free shipping</span>
              )}
            </p>
            <div className="mt-2.5 h-1 bg-asur-graphite overflow-hidden">
              <div className="h-full bg-accent-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <ShoppingBag size={40} strokeWidth={1.2} className="text-asur-iron mb-5" />
              <p className="font-display condensed font-black uppercase text-3xl text-asur-white">Your bag is empty</p>
              <p className="mt-2 text-[14px] text-asur-slate">Heavyweight tees and sleeveless are waiting.</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-8 inline-flex items-center gap-2 h-12 px-6 bg-asur-bone text-asur-black text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white"
              >
                Start shopping <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-asur-graphite px-6">
              {items.map((item) => {
                const unit = item.variant.salePrice || item.variant.price;
                return (
                  <li key={item.variantId} className="flex gap-4 py-5">
                    <Link href={`/product/${item.product.slug}`} onClick={closeCart} className="relative w-24 aspect-[4/5] shrink-0 bg-asur-graphite overflow-hidden">
                      {item.product.images[0] && (
                        <SmartImage src={item.product.images[0].url} alt={item.product.name} fill sizes="96px" className="object-cover" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/product/${item.product.slug}`} onClick={closeCart} className="text-[14px] font-medium text-asur-white leading-snug hover:underline">
                          {item.product.name.replace(/^ASUR\s+/i, "")}
                        </Link>
                        <p className="text-[14px] text-asur-white whitespace-nowrap">{formatPrice(unit * item.quantity)}</p>
                      </div>
                      <p className="mt-1 text-[13px] text-asur-slate">
                        {item.variant.color.name} · {item.variant.size}
                      </p>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <div className="flex items-center border border-asur-iron">
                          <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="h-8 w-8 flex items-center justify-center text-asur-silver hover:text-asur-white" aria-label="Decrease quantity">
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-[13px] text-asur-white tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, Math.min(item.quantity + 1, item.variant.stockQuantity || item.quantity + 1))}
                            className="h-8 w-8 flex items-center justify-center text-asur-silver hover:text-asur-white"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.variantId)} className="text-[12px] text-asur-slate underline underline-offset-4 hover:text-asur-white">
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-asur-graphite px-6 py-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] text-asur-silver">Subtotal</span>
              <span className="text-xl font-medium text-asur-white">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[12px] text-asur-slate">Shipping calculated at checkout.</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="group flex items-center justify-center gap-2 w-full h-14 bg-asur-bone text-asur-black text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white transition-colors"
            >
              Checkout <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <button onClick={closeCart} className="w-full text-[13px] text-asur-silver underline underline-offset-4 hover:text-asur-white">
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
