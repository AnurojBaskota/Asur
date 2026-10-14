"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, History, ImageOff, Minus, Plus, ScanLine, Search, Warehouse, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { adjustStock, getStockHistory, type StockAdjustment } from "@/app/admin/actions";
import { EmptyState, Label, PageHeader, StockBadge, fieldClass } from "./ui";

export type InventoryRow = {
  id: string;
  productId: string;
  productName: string;
  productStatus: string;
  category: string;
  image: string | null;
  size: string;
  colorName: string;
  colorHex: string;
  sku: string;
  barcode: string;
  stock: number;
  threshold: number;
  price: number;
  cost: number;
};

type Movement = Awaited<ReturnType<typeof getStockHistory>>[number];

const REASONS: { value: StockAdjustment["type"]; label: string; mode: StockAdjustment["mode"] }[] = [
  { value: "restock", label: "Restock / received", mode: "add" },
  { value: "return", label: "Customer return", mode: "add" },
  { value: "sale", label: "Sold offline", mode: "remove" },
  { value: "damage", label: "Damaged / lost", mode: "remove" },
  { value: "correction", label: "Stock count correction", mode: "set" },
];

export function InventoryManager({ rows, initialFilter }: { rows: InventoryRow[]; initialFilter: "" | "low" | "out" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState<"" | "low" | "out">(initialFilter);
  const [scan, setScan] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Derived so the drawer shows fresh numbers after router.refresh()
  const selected = selectedId ? rows.find((r) => r.id === selectedId) ?? null : null;
  const scanRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => [...new Set(rows.map((r) => r.category))].sort(), [rows]);

  const stats = useMemo(() => ({
    units: rows.reduce((a, r) => a + r.stock, 0),
    cost: rows.reduce((a, r) => a + r.stock * r.cost, 0),
    retail: rows.reduce((a, r) => a + r.stock * r.price, 0),
    low: rows.filter((r) => r.stock > 0 && r.stock <= r.threshold).length,
    out: rows.filter((r) => r.stock <= 0).length,
  }), [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!needle || `${r.productName} ${r.sku} ${r.barcode} ${r.colorName} ${r.size}`.toLowerCase().includes(needle)) &&
        (!category || r.category === category) &&
        (!filter || (filter === "out" ? r.stock <= 0 : r.stock > 0 && r.stock <= r.threshold))
    );
  }, [rows, q, category, filter]);

  const quick = (row: InventoryRow, delta: 1 | -1) => {
    startTransition(async () => {
      const res = await adjustStock({
        variantId: row.id,
        mode: delta > 0 ? "add" : "remove",
        quantity: 1,
        type: delta > 0 ? "restock" : "correction",
        note: "Quick adjust",
      });
      if (!res.ok) return void toast.error(res.error);
      router.refresh();
    });
  };

  const onScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scan.trim();
    if (!code) return;
    const hit = rows.find((r) => r.barcode === code || r.sku === code.toUpperCase());
    setScan("");
    if (!hit) return void toast.error(`No variant with barcode/SKU ${code}`);
    setSelectedId(hit.id);
  };

  const statCard = (label: string, value: string, sub?: string, tone?: string, onClick?: () => void, active?: boolean) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "text-left bg-asur-carbon border p-4 transition-colors",
        active ? "border-accent-primary" : "border-asur-graphite",
        onClick && "hover:border-asur-iron"
      )}
    >
      <p className="text-caption text-asur-slate uppercase tracking-wider">{label}</p>
      <p className={cn("text-heading-lg font-bold mt-1", tone ?? "text-asur-white")}>{value}</p>
      {sub && <p className="text-caption text-asur-slate mt-0.5">{sub}</p>}
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Stock levels"
        subtitle={`${rows.length} variants · every change is logged with a reason`}
        actions={
          <Link href="/admin/inventory/barcodes">
            <Button variant="outline" size="sm"><span className="flex items-center gap-2"><ScanLine size={14} /> Print labels</span></Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {statCard("Units", stats.units.toLocaleString())}
        {statCard("Value at cost", formatPrice(stats.cost))}
        {statCard("Retail value", formatPrice(stats.retail))}
        {statCard("Low stock", String(stats.low), "Click to filter", "text-status-warning", () => setFilter(filter === "low" ? "" : "low"), filter === "low")}
        {statCard("Sold out", String(stats.out), "Click to filter", "text-status-error", () => setFilter(filter === "out" ? "" : "out"), filter === "out")}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <form onSubmit={onScan} className="relative w-full sm:w-72">
          <ScanLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-primary" />
          <input
            ref={scanRef}
            value={scan}
            onChange={(e) => setScan(e.target.value)}
            placeholder="Scan barcode to adjust…"
            className={cn(fieldClass, "pl-9 border-accent-primary/40")}
            aria-label="Scan barcode"
          />
        </form>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-asur-slate" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by product, SKU, colour, size…" className={cn(fieldClass, "pl-9")} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(fieldClass, "w-auto")} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className={cn(fieldClass, "w-auto")} aria-label="Stock filter">
          <option value="">All stock levels</option>
          <option value="low">Low stock</option>
          <option value="out">Sold out</option>
        </select>
      </div>

      <div className="bg-asur-carbon border border-asur-graphite overflow-x-auto">
        {visible.length === 0 ? (
          <EmptyState icon={<Warehouse size={36} />} title={rows.length ? "Nothing matches those filters" : "No variants yet"}>
            {!rows.length && <Link href="/admin/products/new" className="text-accent-primary hover:underline">Add a product →</Link>}
          </EmptyState>
        ) : (
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-asur-graphite text-left text-caption text-asur-slate uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU / Barcode</th>
                <th className="px-4 py-3 font-medium text-center">On hand</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className={cn("border-b border-asur-graphite/50 last:border-0 hover:bg-asur-steel/10", selected?.id === r.id && "bg-accent-primary/5")}>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-11 shrink-0 bg-asur-graphite overflow-hidden">
                        {r.image ? <SmartImage src={r.image} alt="" fill sizes="36px" className="object-cover" /> : <ImageOff size={12} className="absolute inset-0 m-auto text-asur-iron" />}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${r.productId}`} className="block text-body-sm text-asur-white hover:text-accent-primary truncate">{r.productName}</Link>
                        <span className="flex items-center gap-1.5 text-caption text-asur-silver">
                          <span className="w-2.5 h-2.5 rounded-full border border-asur-iron" style={{ background: r.colorHex }} />
                          {r.colorName} / <span className="text-asur-white font-medium">{r.size}</span>
                          {r.productStatus !== "active" && <span className="text-asur-slate">· {r.productStatus}</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-mono text-caption text-asur-white">{r.sku}</p>
                    <p className="font-mono text-caption text-asur-slate">{r.barcode}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => quick(r, -1)} disabled={pending || r.stock <= 0} className="w-7 h-7 flex items-center justify-center border border-asur-iron text-asur-silver hover:text-asur-white hover:border-asur-silver disabled:opacity-30" aria-label={`Remove one ${r.sku}`}>
                        <Minus size={12} />
                      </button>
                      <span className={cn("w-12 text-center text-body-md font-semibold tabular-nums", r.stock <= 0 ? "text-status-error" : r.stock <= r.threshold ? "text-status-warning" : "text-asur-white")}>
                        {r.stock}
                      </span>
                      <button onClick={() => quick(r, 1)} disabled={pending} className="w-7 h-7 flex items-center justify-center border border-asur-iron text-asur-silver hover:text-asur-white hover:border-asur-silver disabled:opacity-30" aria-label={`Add one ${r.sku}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><StockBadge stock={r.stock} threshold={r.threshold} /></td>
                  <td className="px-5 py-2.5 text-right">
                    <button onClick={() => setSelectedId(r.id)} className="text-caption text-asur-silver hover:text-asur-white uppercase tracking-wider">
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <AdjustDrawer
          row={selected}
          onClose={() => { setSelectedId(null); scanRef.current?.focus(); }}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

function AdjustDrawer({ row, onClose, onSaved }: { row: InventoryRow; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<StockAdjustment["type"]>("restock");
  const mode = REASONS.find((r) => r.value === type)!.mode;
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<Movement[] | null>(null);
  const [pending, startTransition] = useTransition();
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    getStockHistory(row.id).then((h) => live && setHistory(h));
    qtyRef.current?.select();
    return () => { live = false; };
  }, [row.id, row.stock]);

  const n = Number(qty);
  const preview = Number.isInteger(n) && n >= 0 ? (mode === "add" ? row.stock + n : mode === "remove" ? row.stock - n : n) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await adjustStock({ variantId: row.id, mode, quantity: n, type, note });
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${row.sku}: stock is now ${res.data!.stock}`);
      setNote("");
      setQty("1");
      onSaved();
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-asur-carbon border-l border-asur-graphite flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-asur-graphite">
          <div className="min-w-0">
            <p className="text-body-md font-medium text-asur-white truncate">{row.productName}</p>
            <p className="text-caption text-asur-silver">{row.colorName} / {row.size} · <span className="font-mono">{row.sku}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 text-asur-silver hover:text-asur-white" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 flex items-center justify-between border-b border-asur-graphite">
            <span className="text-caption text-asur-slate uppercase tracking-wider">On hand</span>
            <span className="flex items-center gap-3">
              <span className="text-display-sm font-bold text-asur-white tabular-nums">{row.stock}</span>
              <StockBadge stock={row.stock} threshold={row.threshold} />
            </span>
          </div>

          <form onSubmit={submit} className="p-5 space-y-4 border-b border-asur-graphite">
            <div>
              <Label htmlFor="reason">Reason</Label>
              <select id="reason" value={type} onChange={(e) => setType(e.target.value as StockAdjustment["type"])} className={fieldClass}>
                {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="qty" hint={mode === "set" ? "New total after counting" : mode === "add" ? "Units to add" : "Units to remove"}>
                {mode === "set" ? "Counted quantity" : "Quantity"}
              </Label>
              <input ref={qtyRef} id="qty" type="number" min={mode === "set" ? 0 : 1} value={qty} onChange={(e) => setQty(e.target.value)} className={fieldClass} required />
            </div>
            <div>
              <Label htmlFor="note" hint="Optional">Note</Label>
              <input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Supplier invoice #1042" className={fieldClass} />
            </div>
            {preview !== null && (
              <p className={cn("text-body-sm", preview < 0 ? "text-status-error" : "text-asur-silver")}>
                {preview < 0 ? (
                  <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> Not enough stock</span>
                ) : (
                  <>Stock will go from <b className="text-asur-white">{row.stock}</b> to <b className="text-asur-white">{preview}</b></>
                )}
              </p>
            )}
            <Button type="submit" fullWidth loading={pending} disabled={preview === null || preview < 0}>
              Update stock
            </Button>
          </form>

          <div className="p-5">
            <h3 className="flex items-center gap-2 text-caption text-asur-slate uppercase tracking-wider mb-3"><History size={13} /> History</h3>
            {!history ? (
              <p className="text-body-sm text-asur-slate">Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-body-sm text-asur-slate">No movements yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 text-body-sm border-b border-asur-graphite/60 pb-2">
                    <div className="min-w-0">
                      <p className="text-asur-white capitalize">{m.type}</p>
                      {m.note && <p className="text-caption text-asur-slate truncate">{m.note}</p>}
                      <p className="text-caption text-asur-slate">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-semibold tabular-nums", m.change > 0 ? "text-status-success" : m.change < 0 ? "text-status-error" : "text-asur-silver")}>
                        {m.change > 0 ? "+" : ""}{m.change}
                      </p>
                      <p className="text-caption text-asur-slate">→ {m.balance}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
