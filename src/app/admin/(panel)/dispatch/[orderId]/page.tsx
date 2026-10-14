import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { formatOrderNumber } from "@/lib/settings";
import { DispatchScanner } from "@/components/admin/DispatchScanner";

export default async function DispatchOrderPage({ params }: PageProps<"/admin/dispatch/[orderId]">) {
  await requireAdmin();
  const { orderId } = await params;
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) notFound();

  return (
    <DispatchScanner
      order={{
        id: order.id,
        number: formatOrderNumber(order.number),
        status: order.status,
        shipName: order.shipName,
        shipCity: order.shipCity,
        items: order.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          colorName: i.colorName,
          colorHex: i.colorHex,
          size: i.size,
          sku: i.sku,
          barcode: i.barcode,
          image: i.image,
          quantity: i.quantity,
          scannedQty: i.scannedQty,
        })),
      }}
    />
  );
}
