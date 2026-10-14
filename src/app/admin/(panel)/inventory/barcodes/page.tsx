import { requireAdmin } from "@/lib/server/session";
import { getInventory } from "@/lib/server/catalog";
import { LabelPrinter } from "@/components/admin/LabelPrinter";

export default async function BarcodesPage() {
  await requireAdmin();
  const variants = await getInventory();

  return (
    <LabelPrinter
      rows={variants.map((v) => ({
        id: v.id,
        productName: v.product.name,
        category: v.product.category.name,
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex,
        sku: v.sku,
        barcode: v.barcode,
        stock: v.stock,
        price: v.salePrice ?? v.price,
      }))}
    />
  );
}
