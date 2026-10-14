"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, RotateCcw, ScanLine, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import { resetOrderScans, scanOrderItem, updateOrderStatus, type ScanResult } from "@/app/admin/actions";
import { fieldClass } from "./ui";

type Item = {
  id: string;
  productName: string;
  colorName: string;
  colorHex: string;
  size: string;
  sku: string;
  barcode: string;
  image: string | null;
  quantity: number;
  scannedQty: number;
};

function beep(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = ok ? 880 : 220;
    o.type = ok ? "sine" : "square";
    g.gain.value = 0.08;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (ok ? 0.12 : 0.35));
  } catch {
    // Audio not available — visual feedback is enough.
  }
}

export function DispatchScanner({
  order,
}: {
  order: { id: string; number: string; status: string; shipName: string; shipCity: string; items: Item[] };
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [last, setLast] = useState<ScanResult | null>(null);
  const [pending, startTransition] = useTransition();

  const units = order.items.reduce((a, i) => a + i.quantity, 0);
  const scanned = order.items.reduce((a, i) => a + i.scannedQty, 0);
  const complete = scanned === units;
  const open = order.status === "confirmed" || order.status === "processing";

  // Keep focus on the scan field so a USB scanner always types into it.
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    window.addEventListener("click", focus);
    return () => window.removeEventListener("click", focus);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    setCode("");
    if (!value) return;
    startTransition(async () => {
      const res = await scanOrderItem(order.id, value);
      setLast(res);
      beep(res.ok);
      router.refresh();
    });
  };

  const markPacked = () =>
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, "ready_for_dispatch");
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${order.number} packed and ready for pickup`);
      router.push("/admin/dispatch");
    });

  const reset = () => {
    if (!confirm("Reset all scans for this order?")) return;
    startTransition(async () => {
      await resetOrderScans(order.id);
      setLast(null);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/dispatch" className="p-1.5 text-asur-silver hover:text-asur-white" aria-label="Back to dispatch"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-display-sm font-bold text-asur-white font-mono">{order.number}</h1>
            <p className="text-body-sm text-asur-silver">{order.shipName} · {order.shipCity}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={reset} disabled={pending || scanned === 0}><span className="flex items-center gap-2"><RotateCcw size={14} /> Reset</span></Button>
          <Link href={`/admin/orders/${order.id}`}><Button variant="outline" size="sm">Order details</Button></Link>
        </div>
      </div>

      {/* Scan box */}
      <div
        className={cn(
          "p-6 border-2 transition-colors",
          !last ? "border-asur-iron bg-asur-carbon" : last.ok ? "border-status-success bg-status-success/10" : "border-status-error bg-status-error/10"
        )}
      >
        <form onSubmit={submit} className="flex items-center gap-3">
          <ScanLine size={28} className="shrink-0 text-accent-primary" />
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!open}
            placeholder={open ? "Scan item barcode…" : "This order is not open for packing"}
            className={cn(fieldClass, "h-14 text-heading-sm font-mono")}
            aria-label="Scan barcode"
            autoComplete="off"
          />
        </form>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className={cn("flex items-center gap-2 text-body-md", !last ? "text-asur-slate" : last.ok ? "text-status-success" : "text-status-error")}>
            {last ? (last.ok ? <Check size={18} /> : <X size={18} />) : null}
            {last?.message ?? "Scan each item as you put it in the parcel."}
          </p>
          <p className="font-mono text-heading-md text-asur-white tabular-nums">{scanned}/{units}</p>
        </div>
        <div className="mt-3 h-2 bg-asur-graphite">
          <div className="h-full bg-status-success transition-[width]" style={{ width: `${units ? (scanned / units) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Items */}
      <ul className="mt-6 grid sm:grid-cols-2 gap-3">
        {order.items.map((i) => {
          const done = i.scannedQty >= i.quantity;
          return (
            <li
              key={i.id}
              className={cn(
                "flex gap-4 p-3 border transition-colors",
                done ? "border-status-success/40 bg-status-success/5" : last?.itemId === i.id ? "border-accent-primary" : "border-asur-graphite bg-asur-carbon"
              )}
            >
              <div className="relative w-16 h-20 shrink-0 bg-asur-graphite overflow-hidden">
                {i.image && <SmartImage src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                {done && <span className="absolute inset-0 flex items-center justify-center bg-status-success/70"><Check size={26} className="text-white" /></span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-asur-white truncate">{i.productName}</p>
                <p className="flex items-center gap-1.5 text-body-sm text-asur-silver">
                  <span className="w-3 h-3 rounded-full border border-asur-iron" style={{ background: i.colorHex }} />
                  {i.colorName} / <span className="text-asur-white font-semibold">{i.size}</span>
                </p>
                <p className="font-mono text-caption text-asur-slate mt-1">{i.barcode}</p>
              </div>
              <p className={cn("self-center font-mono text-heading-md tabular-nums", done ? "text-status-success" : "text-asur-white")}>
                {i.scannedQty}/{i.quantity}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={markPacked} disabled={!complete || !open || pending}>
          {complete ? "Mark packed — ready for pickup" : `Scan ${units - scanned} more item${units - scanned === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}
