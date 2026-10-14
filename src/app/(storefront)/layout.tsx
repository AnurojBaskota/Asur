import { Toaster } from "react-hot-toast";
import { Navigation } from "@/components/storefront/Navigation";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { getCategoriesWithCounts } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allCategories, settings] = await Promise.all([getCategoriesWithCounts(), getSettings()]);
  const categories = allCategories.filter((c) => c._count.products > 0);

  return (
    <>
      <Navigation
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
        announcements={settings.announcements.filter(Boolean)}
      />
      <CartDrawer freeShippingAt={settings.shipping.freeThreshold} />
      <main>{children}</main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: "#E8E5E0", color: "#0A0A0A", borderRadius: 0, fontSize: 13, fontWeight: 500 },
          iconTheme: { primary: "#0A0A0A", secondary: "#E8E5E0" },
        }}
      />
    </>
  );
}
