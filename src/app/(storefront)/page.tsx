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

export default async function HomePage() {
  const [featured, newArrivals, categories] = await Promise.all([
    getActiveProducts({ featured: true }, 8),
    getActiveProducts({ isNew: true }, 8),
    getCategoriesWithCounts(),
  ]);

  return (
    <>
      <Hero />
      <ValuesMarquee />
      <TrustBar />
      <FeaturedCollection products={featured} />
      <Categories
        categories={categories
          .filter((c) => c._count.products > 0)
          .map((c) => ({ name: c.name, slug: c.slug, image: c.image, description: c.description, count: c._count.products }))}
      />
      <CampaignSection />
      <NewArrivals products={newArrivals} />
      <CraftSection />
      <BrandStory />
      <Newsletter />
      <Footer />
    </>
  );
}
