import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { Footer } from "@/components/storefront/Sections";
import { ProductListing } from "@/components/storefront/ProductGrid";
import { sortProducts } from "@/lib/sort";
import { getActiveProducts, getCategoriesWithCounts } from "@/lib/server/catalog";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  return { title: category ? `${category.name} | ASUR` : "ASUR", description: category?.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const { sort } = await searchParams;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const [products, categories] = await Promise.all([
    getActiveProducts({ categoryId: category.id }),
    getCategoriesWithCounts(),
  ]);

  return (
    <>
      <ProductListing
        overline={`Category · ${products.length} styles`}
        title={category.name}
        description={category.description}
        image={category.image}
        products={sortProducts(products, typeof sort === "string" ? sort : undefined)}
        filters={[
          { label: "All", href: "/shop", active: false },
          ...categories
            .filter((c) => c._count.products > 0 || c.id === category.id)
            .map((c) => ({ label: c.name, href: `/category/${c.slug}`, active: c.id === category.id })),
          { label: "New", href: "/shop?filter=new", active: false },
          { label: "Sale", href: "/shop?filter=sale", active: false },
        ]}
      />
      <Footer />
    </>
  );
}
