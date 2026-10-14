import type { Metadata } from "next";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { getSettings } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Checkout | ASUR", robots: { index: false } };

export default async function CheckoutPage() {
  const { shipping } = await getSettings();
  return (
    <div className="pt-[128px] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <h1 className="sr-only">Checkout</h1>
        <CheckoutForm shipping={shipping} />
      </div>
    </div>
  );
}
