import { Hero } from "@/components/storefront/Hero";
import {
  BrandStory,
  CampaignSection,
  Categories,
  CraftSection,
  FeaturedCollection,
  Footer,
  NewArrivals,
  Newsletter,
  TrustBar,
  ValuesMarquee,
} from "@/components/storefront/Sections";
import { getActiveProducts, getCategoriesWithCounts } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";

export default async function HomePage() {
  const [featured, newArrivals, categories, settings] = await Promise.all([
    getActiveProducts({ featured: true }, 8),
    getActiveProducts({ isNew: true }, 8),
    getCategoriesWithCounts(),
    getSettings(),
  ]);

  return (
    <>
      <Hero h={settings.hero} />
      <ValuesMarquee words={settings.values.filter(Boolean)} />
      <TrustBar shipping={settings.shipping} />
      <FeaturedCollection products={featured} />
      <Categories
        categories={categories
          .filter((c) => c._count.products > 0)
          .map((c) => ({ name: c.name, slug: c.slug, image: c.image, description: c.description, count: c._count.products }))}
      />
      <CampaignSection c={settings.campaign} />
      <NewArrivals products={newArrivals} />
      <CraftSection c={settings.craft} />
      <BrandStory c={settings.story} />
      <Newsletter c={settings.newsletter} />
      <Footer />
    </>
  );
}
