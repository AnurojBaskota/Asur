import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { getAdminProduct } from "@/lib/server/catalog";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <ProductForm
      key={product.updatedAt.toISOString()}
      categories={categories}
      initial={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: product.categoryId,
        collection: product.collection ?? "",
        material: product.material,
        careInstructions: product.careInstructions,
        fit: product.fit,
        weight: product.weight ?? "",
        gender: product.gender,
        tags: product.tags.split(",").filter(Boolean).join(", "),
        featured: product.featured,
        isNew: product.isNew,
        status: product.status as "draft" | "active" | "archived",
        images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
        variants: product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          colorName: v.colorName,
          colorHex: v.colorHex,
          price: String(v.price),
          salePrice: v.salePrice ? String(v.salePrice) : "",
          costPrice: String(v.costPrice),
          stock: String(v.stock),
          lowStockThreshold: String(v.lowStockThreshold),
          sku: v.sku,
          barcode: v.barcode,
        })),
      }}
    />
  );
}
