"use client";

import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/format";
import { SmartImage } from "@/components/ui/SmartImage";
import type { StoreSettings } from "@/lib/settings";
import { shippingFor } from "@/lib/settings";
import { useCartSync } from "@/components/storefront/useCartSync";
import { Button } from "@/components/ui/Button";
import { Minus, Plus, X, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CartView({ shipping: rules }: { shipping: StoreSettings["shipping"] }) {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  useCartSync(true);

  if (items.length === 0) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center pt-[136px]">
          <div className="text-center">
            <h1 className="font-display condensed font-black uppercase leading-[0.9] text-[clamp(2.75rem,6vw,4.5rem)] text-asur-white mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-body-md text-asur-silver mb-8">
              Looks like you haven&apos;t added anything yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-asur-bone text-asur-black px-7 py-3.5 text-body-sm font-medium uppercase tracking-wider hover:bg-asur-white transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  const subtotal = getSubtotal();
  const shipping = shippingFor(subtotal, rules);
  const total = subtotal + shipping;

  return (
    <>
      <div className="pt-[136px] pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display condensed font-black uppercase leading-[0.9] text-[clamp(2.75rem,6vw,4.5rem)] text-asur-white mb-10">
            Shopping Cart
          </h1>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Items */}
            <div className="lg:col-span-2 space-y-0">
              {/* Table Header - Desktop */}
              <div className="hidden sm:grid grid-cols-12 gap-4 pb-4 border-b border-asur-graphite text-caption text-asur-slate uppercase tracking-wider">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {items.map((item) => {
                const price = item.variant.salePrice || item.variant.price;
                return (
                  <div
                    key={item.variantId}
                    className="grid sm:grid-cols-12 gap-4 py-6 border-b border-asur-graphite items-center"
                  >
                    {/* Product */}
                    <div className="sm:col-span-6 flex gap-4">
                      <div className="relative w-20 aspect-[4/5] bg-asur-graphite flex-shrink-0 overflow-hidden">
                        {item.product.images[0] && (
                          <SmartImage src={item.product.images[0].url} alt={item.product.name} fill sizes="80px" className="object-cover" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-body-md font-medium text-asur-white">
                          {item.product.name}
                        </h3>
                        <p className="text-body-sm text-asur-slate mt-0.5">
                          {item.variant.size} / {item.variant.color.name}
                        </p>
                        <p className="text-caption text-asur-slate mt-0.5">
                          SKU: {item.variant.sku}
                        </p>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="mt-2 sm:hidden text-caption text-asur-slate hover:text-status-error transition-colors uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 flex items-center justify-center">
                      <div className="inline-flex items-center border border-asur-iron">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center text-asur-silver hover:text-asur-white"
                          aria-label="Decrease"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-body-sm text-asur-white border-x border-asur-iron">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center text-asur-silver hover:text-asur-white"
                          aria-label="Increase"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="hidden sm:block sm:col-span-2 text-right">
                      <span className="text-body-md text-asur-white">
                        {formatPrice(price)}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-3">
                      <span className="text-body-md font-medium text-asur-white">
                        {formatPrice(price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="p-1 text-asur-slate hover:text-status-error transition-colors"
                        aria-label="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-asur-carbon border border-asur-graphite p-6 sticky top-32">
                <h2 className="text-heading-sm font-medium text-asur-white mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-asur-silver">Subtotal</span>
                    <span className="text-asur-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-asur-silver">Shipping</span>
                    <span className="text-asur-white">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-caption text-asur-slate">
                      Free shipping on orders above {formatPrice(rules.freeThreshold)}
                    </p>
                  )}
                </div>

                <div className="border-t border-asur-graphite pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-body-md font-medium text-asur-white">
                      Total
                    </span>
                    <span className="text-heading-sm font-medium text-asur-white">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button fullWidth size="lg" className="mb-3">
                    <span className="flex items-center gap-2">
                      Checkout
                      <ArrowRight size={16} />
                    </span>
                  </Button>
                </Link>

                <Link
                  href="/"
                  className="block text-center text-body-sm text-asur-silver hover:text-asur-white transition-colors uppercase tracking-wider"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
