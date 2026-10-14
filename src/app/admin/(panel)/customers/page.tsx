import Link from "next/link";
import { Search, Users } from "lucide-react";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState, PageHeader, fieldClass } from "@/components/admin/ui";

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  const { q: raw } = await searchParams;
  const q = typeof raw === "string" ? raw.trim().slice(0, 80) : "";

  const customers = await db.customer.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { email: { contains: q.toLowerCase() } }, { phone: { contains: q } }] } : {},
    include: {
      orders: { where: { status: { notIn: ["cancelled", "returned"] } }, select: { total: true, createdAt: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${customers.length} customers${q ? ` matching “${q}”` : ""}`} />
      <form className="relative max-w-md mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-asur-slate" />
        <input name="q" defaultValue={q} placeholder="Search name, email, phone…" className={cn(fieldClass, "pl-9")} />
      </form>
      <div className="bg-asur-carbon border border-asur-graphite overflow-x-auto">
        {customers.length === 0 ? (
          <EmptyState icon={<Users size={36} />} title="No customers yet">Customers are created automatically when someone checks out.</EmptyState>
        ) : (
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-asur-graphite text-left text-caption text-asur-slate uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Orders</th>
                <th className="px-4 py-3 font-medium text-right">Spent</th>
                <th className="px-5 py-3 font-medium text-right">Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const spent = c.orders.reduce((a, o) => a + o.total, 0);
                const last = c.orders.reduce<Date | null>((a, o) => (!a || o.createdAt > a ? o.createdAt : a), null);
                return (
                  <tr key={c.id} className="border-b border-asur-graphite/50 last:border-0 hover:bg-asur-steel/10">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="text-body-sm text-asur-white hover:text-accent-primary">{c.name}</Link>
                      <p className="text-caption text-asur-slate">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-asur-silver">{c.phone}</td>
                    <td className="px-4 py-3 text-right text-body-sm text-asur-white">{c._count.orders}</td>
                    <td className="px-4 py-3 text-right text-body-sm text-asur-white">{formatPrice(spent)}</td>
                    <td className="px-5 py-3 text-right text-caption text-asur-slate">{last ? last.toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
