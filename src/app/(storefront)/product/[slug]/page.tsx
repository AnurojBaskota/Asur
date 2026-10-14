import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/storefront/Sections";
import { ProductDetail } from "@/components/storefront/ProductDetail";
import { db } from "@/lib/server/db";
import { getActiveProducts, getProductBySlug } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";
import { parseSizeChart } from "@/lib/settings";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found | ASUR" };
  return {
    title: `${product.name} | ASUR`,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [relatedAll, settings, category] = await Promise.all([
    getActiveProducts({ category: { slug: product.category } }, 5),
    getSettings(),
    db.category.findUnique({ where: { slug: product.category }, select: { sizeChart: true } }),
  ]);
  const related = relatedAll.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <ProductDetail product={product} related={related} shipping={settings.shipping} sizeChart={parseSizeChart(category?.sizeChart)} />
      <Footer />
    </>
  );
}
