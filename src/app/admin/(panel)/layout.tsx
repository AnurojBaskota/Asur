import { Toaster } from "react-hot-toast";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";

async function getSidebarCounts() {
  const [toConfirm, toPack, variants] = await Promise.all([
    db.order.count({ where: { status: "pending" } }),
    db.order.count({ where: { status: { in: ["confirmed", "processing"] } } }),
    db.variant.findMany({ where: { product: { status: "active" } }, select: { stock: true, lowStockThreshold: true } }),
  ]);
  return { toConfirm, toPack, lowStock: variants.filter((v) => v.stock <= v.lowStockThreshold).length };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const counts = await getSidebarCounts();

  return (
    <div className="min-h-screen bg-asur-black">
      <AdminSidebar email={session.email} counts={counts} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8">{children}</div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1A1A1A", color: "#FAFAFA", border: "1px solid #3A3A3A", borderRadius: 8, fontSize: 14 },
        }}
      />
    </div>
  );
}
