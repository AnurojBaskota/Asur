import { requireAdmin } from "@/lib/server/session";
import { getInventory } from "@/lib/server/catalog";
import { InventoryManager } from "@/components/admin/InventoryManager";

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin();
  const { filter } = await searchParams;
  const variants = await getInventory();

  return (
    <InventoryManager
      initialFilter={filter === "low" || filter === "out" ? filter : ""}
      rows={variants.map((v) => ({
        id: v.id,
        productId: v.product.id,
        productName: v.product.name,
        productStatus: v.product.status,
        category: v.product.category.name,
        image: v.product.images[0]?.url ?? null,
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex,
        sku: v.sku,
        barcode: v.barcode,
        stock: v.stock,
        threshold: v.lowStockThreshold,
        price: v.salePrice ?? v.price,
        cost: v.costPrice,
      }))}
    />
  );
}
