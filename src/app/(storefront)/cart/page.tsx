import type { Metadata } from "next";
import { CartView } from "@/components/storefront/CartView";
import { Footer } from "@/components/storefront/Sections";
import { getSettings } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Your bag | ASUR" };

export default async function CartPage() {
  const { shipping } = await getSettings();
  return (
    <>
      <CartView shipping={shipping} />
      <Footer />
    </>
  );
}
