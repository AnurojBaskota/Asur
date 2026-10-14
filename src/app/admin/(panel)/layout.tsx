import { Toaster } from "react-hot-toast";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/server/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-asur-black">
      <AdminSidebar email={session.email} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8">{children}</div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1A1A1A", color: "#FAFAFA", border: "1px solid #3A3A3A", borderRadius: 2, fontSize: 14 },
        }}
      />
    </div>
  );
}
