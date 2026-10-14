import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { parseSizeChart } from "@/lib/settings";

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <CategoryManager
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        image: c.image ?? "",
        sortOrder: c.sortOrder,
        productCount: c._count.products,
        sizeChart: parseSizeChart(c.sizeChart),
      }))}
    />
  );
}
