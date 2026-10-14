import Link from "next/link";
import { PackageCheck, ScanLine, Truck } from "lucide-react";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, formatOrderNumber, type OrderStatusValue } from "@/lib/settings";
import { EmptyState, OrderStatusPill, PageHeader } from "@/components/admin/ui";

export default async function DispatchPage() {
  await requireAdmin();
  const orders = await db.order.findMany({
    where: { status: { in: ["confirmed", "processing", "ready_for_dispatch"] } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const toPack = orders.filter((o) => o.status !== "ready_for_dispatch");
  const ready = orders.filter((o) => o.status === "ready_for_dispatch");

  const card = (o: (typeof orders)[number]) => {
    const units = o.items.reduce((a, i) => a + i.quantity, 0);
    const scanned = o.items.reduce((a, i) => a + i.scannedQty, 0);
    return (
      <Link
        key={o.id}
        href={o.status === "ready_for_dispatch" ? `/admin/orders/${o.id}` : `/admin/dispatch/${o.id}`}
        className="block bg-asur-carbon border border-asur-graphite hover:border-asur-iron p-4 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-body-sm text-asur-white">{formatOrderNumber(o.number)}</span>
          <OrderStatusPill status={o.status} label={ORDER_STATUS_LABEL[o.status as OrderStatusValue]} />
        </div>
        <p className="mt-2 text-body-sm text-asur-silver">{o.shipName} · {o.shipCity}</p>
        <div className="mt-3 h-1 bg-asur-graphite">
          <div className="h-full bg-accent-primary" style={{ width: `${units ? (scanned / units) * 100 : 0}%` }} />
        </div>
        <p className="mt-1.5 flex justify-between text-caption text-asur-slate">
          <span>{scanned}/{units} scanned</span>
          <span>{formatPrice(o.total)} COD</span>
        </p>
      </Link>
    );
  };

  return (
    <div>
      <PageHeader title="Dispatch" subtitle="Scan every item before it leaves — wrong items are blocked." />
      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="flex items-center gap-2 text-body-md font-medium text-asur-white mb-4"><ScanLine size={16} className="text-accent-primary" /> To pack ({toPack.length})</h2>
          {toPack.length ? <div className="space-y-3">{toPack.map(card)}</div> : (
            <div className="bg-asur-carbon border border-asur-graphite"><EmptyState icon={<PackageCheck size={32} />} title="Nothing to pack">Confirm orders to add them to this queue.</EmptyState></div>
          )}
        </section>
        <section>
          <h2 className="flex items-center gap-2 text-body-md font-medium text-asur-white mb-4"><Truck size={16} className="text-accent-primary" /> Packed, awaiting pickup ({ready.length})</h2>
          {ready.length ? <div className="space-y-3">{ready.map(card)}</div> : (
            <div className="bg-asur-carbon border border-asur-graphite"><EmptyState icon={<Truck size={32} />} title="Nothing waiting for pickup" /></div>
          )}
        </section>
      </div>
    </div>
  );
}
