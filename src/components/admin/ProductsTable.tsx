"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageOff, Package, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setProductStatus } from "@/app/admin/actions";
import { EmptyState, PageHeader, StatusBadge, fieldClass } from "./ui";

type Row = {
  id: string;
  name: string;
  slug: string;
  status: string;
  image: string | null;
  categoryId: string;
  categoryName: string;
  variantCount: number;
  colors: string[];
  stock: number;
  lowCount: number;
  outCount: number;
  minPrice: number;
  onSale: boolean;
  skus: string;
  updatedAt: string;
};

export function ProductsTable({
  products,
  categories,
  initialCategory,
}: {
  products: Row[];
  categories: { id: string; name: string }[];
  initialCategory: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!needle || p.name.toLowerCase().includes(needle) || p.skus.toLowerCase().includes(needle)) &&
        (!category || p.categoryId === category) &&
        (!status || p.status === status) &&
        (!stockFilter || (stockFilter === "low" ? p.lowCount > 0 : p.outCount > 0))
    );
  }, [products, q, category, status, stockFilter]);

  const toggleStatus = (p: Row) => {
    const next = p.status === "active" ? "draft" : "active";
    startTransition(async () => {
      const res = await setProductStatus(p.id, next);
      if (!res.ok) return void toast.error(res.error);
      toast.success(next === "active" ? `${p.name} is live` : `${p.name} unpublished`);
      router.refresh();
    });
  };

  const counts = {
    active: products.filter((p) => p.status === "active").length,
    draft: products.filter((p) => p.status === "draft").length,
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products · ${counts.active} live · ${counts.draft} draft`}
        actions={
          <Link href="/admin/products/new">
            <Button size="sm"><span className="flex items-center gap-2"><Plus size={14} /> Add product</span></Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-56 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-asur-slate" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU or barcode…" className={cn(fieldClass, "pl-9")} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(fieldClass, "w-auto")} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={cn(fieldClass, "w-auto")} aria-label="Filter by status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className={cn(fieldClass, "w-auto")} aria-label="Filter by stock">
          <option value="">Any stock</option>
          <option value="low">Has low stock</option>
          <option value="out">Has sold-out sizes</option>
        </select>
      </div>

      <div className="bg-asur-carbon border border-asur-graphite overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState icon={<Package size={36} />} title={products.length ? "No products match those filters" : "No products yet"}>
            {!products.length && <Link href="/admin/products/new" className="text-accent-primary hover:underline">Add your first product →</Link>}
          </EmptyState>
        ) : (
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-asur-graphite text-left text-caption text-asur-slate uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Visible</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-asur-graphite/50 last:border-0 hover:bg-asur-steel/10 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 group">
                      <div className="relative w-11 h-14 shrink-0 bg-asur-graphite overflow-hidden">
                        {p.image ? (
                          <SmartImage src={p.image} alt="" fill sizes="44px" className="object-cover" />
                        ) : (
                          <ImageOff size={14} className="absolute inset-0 m-auto text-asur-iron" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-asur-white group-hover:text-accent-primary transition-colors truncate">{p.name}</p>
                        <p className="flex items-center gap-1.5 text-caption text-asur-slate mt-0.5">
                          {p.colors.map((hex) => <span key={hex} className="w-2.5 h-2.5 rounded-full border border-asur-iron" style={{ background: hex }} />)}
                          <span>{p.variantCount} variants</span>
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-asur-silver">{p.categoryName}</td>
                  <td className="px-4 py-3 text-body-sm text-asur-white">
                    {p.minPrice ? formatPrice(p.minPrice) : "—"}
                    {p.onSale && <span className="block text-caption text-status-success">On sale</span>}
                  </td>
                  <td className="px-4 py-3 text-body-sm">
                    <span className={cn(p.stock === 0 ? "text-status-error" : "text-asur-white")}>{p.stock} units</span>
                    {(p.lowCount > 0 || p.outCount > 0) && (
                      <span className="block text-caption">
                        {p.outCount > 0 && <span className="text-status-error">{p.outCount} sold out </span>}
                        {p.lowCount > 0 && <span className="text-status-warning">{p.lowCount} low</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <button
                      role="switch"
                      aria-checked={p.status === "active"}
                      aria-label={p.status === "active" ? `Unpublish ${p.name}` : `Publish ${p.name}`}
                      disabled={pending}
                      onClick={() => toggleStatus(p)}
                      className={cn("relative inline-block h-5 w-9 rounded-full transition-colors disabled:opacity-50", p.status === "active" ? "bg-status-success" : "bg-asur-iron")}
                    >
                      <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-asur-white transition-transform", p.status === "active" && "translate-x-4")} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
