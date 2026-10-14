"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/format";
import { SmartImage } from "@/components/ui/SmartImage";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const [step, setStep] = useState<string>("shipping");
  const [loading, setLoading] = useState(false);

  const subtotal = getSubtotal();
  const shipping = subtotal >= 5000 ? 0 : 150;
  const total = subtotal + shipping;

  const handlePlaceOrder = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("complete");
      clearCart();
    }, 2000);
  };

  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-[136px]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-6 bg-status-success/10 border border-status-success/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display condensed font-black uppercase leading-[0.9] text-[clamp(2.75rem,6vw,4.5rem)] text-asur-white mb-3">
            Order Confirmed
          </h1>
          <p className="text-body-md text-asur-silver mb-2">
            Thank you for your order!
          </p>
          <p className="text-body-sm text-asur-slate mb-8">
            Order #AS{Math.floor(10000 + Math.random() * 90000)} — You&apos;ll receive a confirmation email shortly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-asur-bone text-asur-black px-7 py-3.5 text-body-sm font-medium uppercase tracking-wider hover:bg-asur-white transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step !== "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-[136px]">
        <div className="text-center">
          <h1 className="font-display condensed font-black uppercase leading-[0.9] text-[clamp(2.75rem,6vw,4.5rem)] text-asur-white mb-4">
            No Items to Checkout
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-asur-bone text-asur-black px-7 py-3.5 text-body-sm font-medium uppercase tracking-wider hover:bg-asur-white transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[136px] pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-body-sm text-asur-silver hover:text-asur-white transition-colors mb-8"
        >
          <ChevronLeft size={14} />
          Back to Cart
        </Link>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            <h1 className="font-display condensed font-black uppercase leading-[0.9] text-[clamp(2.75rem,6vw,4.5rem)] text-asur-white mb-8">
              Checkout
            </h1>

            {/* Steps */}
            <div className="flex items-center gap-4 mb-10">
              <button
                onClick={() => setStep("shipping")}
                className={`text-body-sm uppercase tracking-wider transition-colors ${
                  step === "shipping" ? "text-asur-white" : "text-asur-slate"
                }`}
              >
                1. Shipping
              </button>
              <div className="w-8 h-px bg-asur-iron" />
              <button
                onClick={() => step === "payment" && setStep("payment")}
                className={`text-body-sm uppercase tracking-wider transition-colors ${
                  step === "payment" ? "text-asur-white" : "text-asur-slate"
                }`}
              >
                2. Payment
              </button>
            </div>

            {step === "shipping" && (
              <div className="space-y-6">
                <h2 className="text-heading-md font-medium text-asur-white">
                  Shipping Address
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" id="firstName" placeholder="Aarav" />
                  <Input label="Last Name" id="lastName" placeholder="Sharma" />
                </div>
                <Input label="Email" id="email" type="email" placeholder="aarav@example.com" />
                <Input label="Phone" id="phone" placeholder="+977-98XXXXXXXX" />
                <Input label="Street Address" id="street" placeholder="Street name, house number" />
                <Input label="Apartment (Optional)" id="apt" placeholder="Apt, suite, floor" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" id="city" placeholder="Kathmandu" />
                  <Input label="Postal Code" id="postal" placeholder="44600" />
                </div>
                <Input label="Country" id="country" placeholder="Nepal" />

                <Button
                  size="lg"
                  onClick={() => setStep("payment")}
                  className="mt-4"
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-6">
                <h2 className="text-heading-md font-medium text-asur-white">
                  Payment
                </h2>

                <div className="p-4 bg-asur-graphite border border-asur-iron">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock size={14} className="text-asur-slate" />
                    <span className="text-caption text-asur-slate">Secure payment</span>
                  </div>

                  <div className="space-y-4">
                    <Input label="Card Number" id="cardNumber" placeholder="4242 4242 4242 4242" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Expiry" id="expiry" placeholder="MM/YY" />
                      <Input label="CVC" id="cvc" placeholder="123" />
                    </div>
                    <Input label="Name on Card" id="cardName" placeholder="Full name" />
                  </div>
                </div>

                {/* Cash on Delivery option */}
                <div className="p-4 border border-asur-iron hover:border-asur-silver transition-colors cursor-pointer">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="w-4 h-4 accent-accent-primary"
                    />
                    <div>
                      <p className="text-body-sm text-asur-white">Cash on Delivery</p>
                      <p className="text-caption text-asur-slate">
                        Pay when you receive your order
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  size="lg"
                  onClick={handlePlaceOrder}
                  loading={loading}
                  className="mt-4"
                  fullWidth
                >
                  Place Order — {formatPrice(total)}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-asur-carbon border border-asur-graphite p-6 sticky top-32">
              <h2 className="text-heading-sm font-medium text-asur-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 py-2">
                    <div className="w-12 h-14 bg-asur-graphite flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                      {item.product.images[0] && (
                        <SmartImage src={item.product.images[0].url} alt={item.product.name} fill sizes="48px" className="object-cover" />
                      )}
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-asur-iron text-[10px] text-asur-white rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-asur-white line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-caption text-asur-slate">
                        {item.variant.size} / {item.variant.color.name}
                      </p>
                    </div>
                    <span className="text-body-sm text-asur-white">
                      {formatPrice(
                        (item.variant.salePrice || item.variant.price) *
                          item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-asur-graphite pt-4 space-y-2">
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
                <div className="flex justify-between text-body-md font-medium pt-2 border-t border-asur-graphite">
                  <span className="text-asur-white">Total</span>
                  <span className="text-asur-white">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
