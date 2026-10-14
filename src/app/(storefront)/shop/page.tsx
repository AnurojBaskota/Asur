import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Footer } from "@/components/storefront/Sections";
import { ProductListing } from "@/components/storefront/ProductGrid";
import { sortProducts } from "@/lib/sort";
import { getActiveProducts, getCategoriesWithCounts } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Shop All | ASUR" };

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const { filter, q, sort } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";

  const where: Prisma.ProductWhereInput = {};
  if (filter === "new") where.isNew = true;
  if (filter === "sale") where.variants = { some: { salePrice: { not: null } } };
  if (query) where.OR = [
    { name: { contains: query, mode: "insensitive" } },
    { description: { contains: query, mode: "insensitive" } },
    { tags: { contains: query, mode: "insensitive" } },
  ];

  const [products, categories] = await Promise.all([getActiveProducts(where), getCategoriesWithCounts()]);

  return (
    <>
      <ProductListing
        overline={query ? "Search results" : filter === "new" ? "Just dropped" : filter === "sale" ? "Limited time" : "The full collection"}
        title={query ? `“${query}”` : filter === "new" ? "New in" : filter === "sale" ? "Sale" : "Shop all"}
        products={sortProducts(products, typeof sort === "string" ? sort : undefined)}
        filters={[
          { label: "All", href: "/shop", active: !filter && !query },
          ...categories.filter((c) => c._count.products > 0).map((c) => ({ label: c.name, href: `/category/${c.slug}`, active: false })),
          { label: "New", href: "/shop?filter=new", active: filter === "new" },
          { label: "Sale", href: "/shop?filter=sale", active: filter === "sale" },
        ]}
      />
      <Footer />
    </>
  );
}
