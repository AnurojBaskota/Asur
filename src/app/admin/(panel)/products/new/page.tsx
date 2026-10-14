import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return <ProductForm categories={categories} />;
}
