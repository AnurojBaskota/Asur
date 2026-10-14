"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/settings";
import { addOrderNote, setPaymentStatus, updateOrderStatus } from "@/app/admin/actions";
import { Label, Panel, fieldClass } from "./ui";

const VERB: Partial<Record<OrderStatusValue, string>> = {
  confirmed: "Confirm order",
  processing: "Start packing",
  ready_for_dispatch: "Mark packed",
  dispatched: "Mark dispatched",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
  returned: "Mark returned",
};

export function OrderActions({
  orderId,
  status,
  next,
  paymentStatus,
  allScanned,
}: {
  orderId: string;
  status: OrderStatusValue;
  next: OrderStatusValue[];
  paymentStatus: string;
  allScanned: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error ?? "Something went wrong");
      toast.success(success);
      router.refresh();
    });

  const move = (to: OrderStatusValue) => {
    if ((to === "cancelled" || to === "returned") && !confirm(`${VERB[to]}? Items will be put back into stock.`)) return;
    run(() => updateOrderStatus(orderId, to, note), `Order ${ORDER_STATUS_LABEL[to].toLowerCase()}`);
    setNote("");
  };

  const forward = next.filter((s) => s !== "cancelled" && s !== "returned");
  const destructive = next.filter((s) => s === "cancelled" || s === "returned");

  return (
    <Panel title="Actions">
      <div className="space-y-3">
        {forward.map((s) => (
          <Button
            key={s}
            fullWidth
            onClick={() => move(s)}
            disabled={pending || (s === "ready_for_dispatch" && !allScanned)}
            title={s === "ready_for_dispatch" && !allScanned ? "Scan every item first" : undefined}
          >
            {VERB[s] ?? ORDER_STATUS_LABEL[s]}
          </Button>
        ))}
        {forward.includes("ready_for_dispatch") && !allScanned && (
          <p className="text-caption text-asur-slate">Scan all items on the Pack &amp; scan screen to mark packed.</p>
        )}
        {next.length === 0 && <p className="text-body-sm text-asur-slate">This order is closed.</p>}

        <div className="pt-3">
          <Label htmlFor="order-note" hint="Saved to the timeline">Note</Label>
          <textarea id="order-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={cn(fieldClass, "resize-none")} placeholder="Called customer, confirmed address…" />
          <Button variant="outline" size="sm" className="mt-2" disabled={pending || !note.trim()} onClick={() => { run(() => addOrderNote(orderId, note), "Note added"); setNote(""); }}>
            Add note
          </Button>
        </div>

        <div className="pt-4 border-t border-asur-graphite">
          <Label>Payment</Label>
          <div className="flex gap-2">
            {(["pending", "paid", "refunded"] as const).map((p) => (
              <button
                key={p}
                disabled={pending || p === paymentStatus}
                onClick={() => run(() => setPaymentStatus(orderId, p), `Payment marked ${p}`)}
                className={cn(
                  "flex-1 h-9 border text-caption uppercase tracking-wider transition-colors",
                  p === paymentStatus ? "border-asur-white text-asur-white" : "border-asur-iron text-asur-slate hover:text-asur-white"
                )}
              >
                {p === "pending" ? "Unpaid" : p}
              </button>
            ))}
          </div>
        </div>

        {destructive.length > 0 && (
          <div className="pt-4 border-t border-asur-graphite flex gap-2">
            {destructive.map((s) => (
              <Button key={s} variant="ghost" size="sm" className="text-status-error hover:text-status-error" onClick={() => move(s)} disabled={pending}>
                {VERB[s]}
              </Button>
            ))}
          </div>
        )}
        {status !== "cancelled" && status !== "returned" && (
          <button onClick={() => window.print()} className="w-full text-caption text-asur-slate hover:text-asur-white underline underline-offset-4">Print order</button>
        )}
      </div>
    </Panel>
  );
}
