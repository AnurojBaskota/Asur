"use client";

import { useMemo, useState } from "react";
import { Printer, ScanLine, Search, Tags } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BarcodeSvg } from "./BarcodeSvg";
import { EmptyState, PageHeader, Panel, Toggle, fieldClass } from "./ui";

type Row = {
  id: string;
  productName: string;
  category: string;
  size: string;
  colorName: string;
  colorHex: string;
  sku: string;
  barcode: string;
  stock: number;
  price: number;
};

const MAX_LABELS = 400;

export function LabelPrinter({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [showPrice, setShowPrice] = useState(true);
  const [scan, setScan] = useState("");
  const [scanned, setScanned] = useState<Row | null | "miss">(null);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => `${r.productName} ${r.sku} ${r.barcode} ${r.colorName} ${r.size}`.toLowerCase().includes(needle));
  }, [rows, q]);

  const labels = useMemo(
    () => rows.flatMap((r) => Array.from({ length: qty[r.id] ?? 0 }, (_, i) => ({ ...r, key: `${r.id}-${i}` }))),
    [rows, qty]
  );
  const total = labels.length;

  const setMany = (list: Row[], fn: (r: Row) => number) =>
    setQty((prev) => {
      const next = { ...prev };
      list.forEach((r) => { next[r.id] = Math.max(0, Math.min(fn(r), 999)); });
      return next;
    });

  const print = () => {
    if (!total) return toast.error("Choose how many labels to print first");
    if (total > MAX_LABELS) return toast.error(`That's ${total} labels — print at most ${MAX_LABELS} at a time`);
    window.print();
  };

  const onScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scan.trim();
    if (!code) return;
    const hit = rows.find((r) => r.barcode === code || r.sku === code.toUpperCase());
    setScanned(hit ?? "miss");
    if (hit) setQty((p) => ({ ...p, [hit.id]: (p[hit.id] ?? 0) + 1 }));
    setScan("");
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Barcodes & labels"
          subtitle="Every variant gets a unique EAN-13 when it's created. Pick quantities, then print."
          actions={
            <Button size="sm" onClick={print} disabled={!total}>
              <span className="flex items-center gap-2"><Printer size={14} /> Print {total || ""} label{total === 1 ? "" : "s"}</span>
            </Button>
          }
        />

        <div className="grid xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-asur-slate" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, SKU, barcode…" className={cn(fieldClass, "pl-9")} />
              </div>
              <Button variant="outline" size="sm" onClick={() => setMany(visible, (r) => r.stock)}>Qty = stock</Button>
              <Button variant="outline" size="sm" onClick={() => setMany(visible, () => 1)}>1 each</Button>
              <Button variant="ghost" size="sm" onClick={() => setQty({})}>Clear</Button>
            </div>

            <div className="bg-asur-carbon border border-asur-graphite max-h-[60vh] overflow-y-auto">
              {visible.length === 0 ? (
                <EmptyState icon={<Tags size={32} />} title="No variants found" />
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-asur-carbon">
                    <tr className="border-b border-asur-graphite text-left text-caption text-asur-slate uppercase tracking-wider">
                      <th className="px-4 py-2.5 font-medium">Variant</th>
                      <th className="px-3 py-2.5 font-medium">Barcode</th>
                      <th className="px-3 py-2.5 font-medium text-right">Stock</th>
                      <th className="px-4 py-2.5 font-medium text-right w-28">Labels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id} className={cn("border-b border-asur-graphite/50 last:border-0", (qty[r.id] ?? 0) > 0 && "bg-accent-primary/5")}>
                        <td className="px-4 py-2">
                          <p className="text-body-sm text-asur-white truncate max-w-64">{r.productName}</p>
                          <p className="flex items-center gap-1.5 text-caption text-asur-silver">
                            <span className="w-2.5 h-2.5 rounded-full border border-asur-iron" style={{ background: r.colorHex }} />
                            {r.colorName} / {r.size}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-mono text-caption text-asur-white">{r.barcode}</p>
                          <p className="font-mono text-caption text-asur-slate">{r.sku}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-body-sm text-asur-silver tabular-nums">{r.stock}</td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={999}
                            value={qty[r.id] ?? 0}
                            onChange={(e) => setMany([r], () => Number(e.target.value) || 0)}
                            className={cn(fieldClass, "w-20 py-1.5 text-right")}
                            aria-label={`Labels for ${r.sku}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <Panel title={<span className="flex items-center gap-2"><ScanLine size={15} className="text-accent-primary" /> Scan to check</span>}>
              <form onSubmit={onScan}>
                <input
                  value={scan}
                  onChange={(e) => setScan(e.target.value)}
                  placeholder="Scan or type a barcode / SKU"
                  className={cn(fieldClass, "font-mono")}
                  aria-label="Scan barcode"
                />
              </form>
              {scanned === "miss" && <p className="mt-3 text-body-sm text-status-error">Not found — this barcode isn&apos;t in your catalogue.</p>}
              {scanned && scanned !== "miss" && (
                <div className="mt-3 p-3 border border-status-success/30 bg-status-success/5">
                  <p className="text-body-sm text-asur-white">{scanned.productName}</p>
                  <p className="text-caption text-asur-silver">
                    {scanned.colorName} / {scanned.size} · {formatPrice(scanned.price)} · <span className="text-asur-white">{scanned.stock} in stock</span>
                  </p>
                  <p className="text-caption text-asur-slate mt-1">+1 label added</p>
                </div>
              )}
            </Panel>

            <Panel title="Label preview" action={<span className="text-caption text-asur-slate">50 × 30 mm</span>}>
              <div className="mb-4">
                <Toggle checked={showPrice} onChange={setShowPrice} label="Print price on label" />
              </div>
              {rows[0] ? (
                <div className="bg-neutral-200 p-4 flex justify-center">
                  <Label row={labels[0] ?? rows[0]} showPrice={showPrice} />
                </div>
              ) : null}
              <p className="text-caption text-asur-slate mt-3">
                Prints 4 per row on A4. For a thermal label printer, set the paper size to 50 × 30 mm in the print dialog.
              </p>
            </Panel>
          </div>
        </div>
      </div>

      {/* Print-only sheet */}
      <div id="label-sheet" className="hidden print:grid grid-cols-4 gap-[2mm]">
        {labels.slice(0, MAX_LABELS).map((l) => <Label key={l.key} row={l} showPrice={showPrice} />)}
      </div>
    </div>
  );
}

function Label({ row, showPrice }: { row: Row; showPrice: boolean }) {
  return (
    <div className="label bg-white text-black w-[50mm] h-[30mm] px-[2.5mm] py-[1.5mm] flex flex-col overflow-hidden break-inside-avoid">
      <div className="flex items-baseline justify-between gap-1 leading-none">
        <span className="text-[7pt] font-bold tracking-[0.2em]">ASUR</span>
        {showPrice && <span className="text-[7pt] font-semibold">{formatPrice(row.price)}</span>}
      </div>
      <p className="text-[6.5pt] leading-tight mt-[0.6mm] truncate">{row.productName.replace(/^ASUR\s+/i, "")}</p>
      <p className="text-[6.5pt] leading-tight font-semibold">{row.colorName} · {row.size}</p>
      <div className="flex-1 min-h-0 flex items-end justify-center">
        <BarcodeSvg value={row.barcode} height={28} width={1.15} fontSize={9} className="max-w-full h-auto" />
      </div>
    </div>
  );
}
