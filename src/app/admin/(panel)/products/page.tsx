import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { getAdminProducts } from "@/lib/server/catalog";
import { ProductsTable } from "@/components/admin/ProductsTable";

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return (
    <ProductsTable
      initialCategory={typeof category === "string" ? category : ""}
      categories={categories}
      products={products.map((p) => {
        const prices = p.variants.map((v) => v.salePrice ?? v.price);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          status: p.status,
          image: p.images[0]?.url ?? null,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          variantCount: p.variants.length,
          colors: [...new Map(p.variants.map((v) => [v.colorName, v.colorHex])).values()],
          stock: p.variants.reduce((a, v) => a + v.stock, 0),
          lowCount: p.variants.filter((v) => v.stock > 0 && v.stock <= v.lowStockThreshold).length,
          outCount: p.variants.filter((v) => v.stock <= 0).length,
          minPrice: prices.length ? Math.min(...prices) : 0,
          onSale: p.variants.some((v) => v.salePrice),
          skus: p.variants.map((v) => `${v.sku} ${v.barcode}`).join(" "),
          updatedAt: p.updatedAt.toISOString(),
        };
      })}
    />
  );
}
