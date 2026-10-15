import { Hero } from "@/components/storefront/Hero";
import {
  CampaignStrip,
  CategoryRail,
  Footer,
  Newsletter,
  ShopBanners,
  type RailTile,
} from "@/components/storefront/Sections";
import { ProductRail, ProductWall } from "@/components/storefront/HomeShop";
import { getActiveProducts, getBestSellerIds, getCategoriesWithCounts } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";

// Product-first homepage (Gymshark / YoungLA pattern): short hero, category
// rail, tabbed product rail, category banners, campaign strip, product wall.
export default async function HomePage() {
  const [all, categories, settings, bestSellerIds] = await Promise.all([
    getActiveProducts(),
    getCategoriesWithCounts(),
    getSettings(),
    getBestSellerIds(12),
  ]);

  const inStock = (p: (typeof all)[number]) => p.variants.some((v) => v.stockQuantity > 0);
  const newIn = all.filter((p) => p.isNew);
  const onSale = all.filter((p) => p.variants.some((v) => v.salePrice));
  // Real best sellers first, topped up with featured picks so the rail is never thin.
  const popular = [
    ...bestSellerIds.map((id) => all.find((p) => p.id === id)).filter((p): p is (typeof all)[number] => !!p),
    ...all.filter((p) => p.featured && !bestSellerIds.includes(p.id)),
  ].filter(inStock);
  const liveCategories = categories.filter((c) => c._count.products > 0);

  const tiles: RailTile[] = [
    ...(newIn[0] ? [{ label: "New in", href: "/shop?filter=new", image: newIn[0].images[0]?.url ?? null, sub: `${newIn.length} styles` }] : []),
    ...liveCategories.map((c) => ({ label: c.name, href: `/category/${c.slug}`, image: c.image, sub: `${c._count.products} styles` })),
    ...(onSale[0] ? [{ label: "Sale", href: "/shop?filter=sale", image: onSale[0].images[0]?.url ?? null, sub: `${onSale.length} styles` }] : []),
    { label: "Shop all", href: "/shop", image: all[all.length - 1]?.images[0]?.url ?? null, sub: `${all.length} styles` },
  ];

  return (
    <>
      <Hero h={settings.hero} />
      <div id="shop" className="scroll-mt-24" />
      <CategoryRail tiles={tiles} />
      <ProductRail
        title="Popular right now"
        bestSellerIds={bestSellerIds}
        tabs={[
          { key: "popular", label: "Popular", href: "/shop", products: popular.slice(0, 12) },
          { key: "new", label: "New in", href: "/shop?filter=new", products: newIn.slice(0, 12) },
          { key: "sale", label: "Sale", href: "/shop?filter=sale", products: onSale.slice(0, 12) },
        ]}
      />
      <ShopBanners
        categories={liveCategories.map((c) => ({ name: c.name, slug: c.slug, image: c.image, description: c.description, count: c._count.products }))}
      />
      <ProductWall
        title="Shop the range"
        bestSellerIds={bestSellerIds}
        groups={[
          { key: "all", label: "All", href: "/shop", products: all },
          ...liveCategories.map((c) => ({
            key: c.slug,
            label: c.name,
            href: `/category/${c.slug}`,
            products: all.filter((p) => p.category === c.slug),
          })),
        ]}
      />
      <CampaignStrip c={settings.campaign} />
      <Newsletter c={settings.newsletter} />
      <Footer />
    </>
  );
}
