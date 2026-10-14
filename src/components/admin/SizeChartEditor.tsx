"use client";

import { Plus, Trash2, X } from "lucide-react";
import type { SizeChart } from "@/lib/settings";
import { fieldClass } from "./ui";
import { cn } from "@/lib/utils";

const STARTER: SizeChart = {
  columns: ["Size", "Chest (cm)", "Length (cm)", "Shoulder (cm)"],
  rows: [["S", "", "", ""], ["M", "", "", ""], ["L", "", "", ""], ["XL", "", "", ""]],
  note: "Garment measurements in centimetres, measured flat.",
};

export function SizeChartEditor({ value, onChange }: { value: SizeChart | null; onChange: (v: SizeChart | null) => void }) {
  if (!value) {
    return (
      <button type="button" onClick={() => onChange(STARTER)} className="w-full border-2 border-dashed border-asur-iron p-5 text-body-sm text-asur-silver hover:border-asur-silver hover:text-asur-white">
        <Plus size={16} className="inline mr-1.5 -mt-0.5" /> Add a size chart
      </button>
    );
  }

  const setCell = (r: number, c: number, v: string) =>
    onChange({ ...value, rows: value.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)) });
  const cell = "w-full min-w-16 bg-transparent px-2 py-1.5 text-body-sm text-asur-white border border-transparent hover:border-asur-iron focus:border-asur-silver focus:bg-asur-graphite focus:outline-none";

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-asur-iron">
        <table className="w-full">
          <thead>
            <tr className="bg-asur-graphite">
              {value.columns.map((col, ci) => (
                <th key={ci} className="p-1 font-normal">
                  <div className="flex items-center">
                    <input
                      value={col}
                      onChange={(e) => onChange({ ...value, columns: value.columns.map((c, i) => (i === ci ? e.target.value : c)) })}
                      className={cn(cell, "text-caption uppercase tracking-wider text-asur-silver")}
                      aria-label={`Column ${ci + 1} name`}
                    />
                    {value.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onChange({ ...value, columns: value.columns.filter((_, i) => i !== ci), rows: value.rows.map((r) => r.filter((_, i) => i !== ci)) })}
                        className="p-1 text-asur-slate hover:text-status-error"
                        aria-label={`Remove column ${col}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-8 p-1">
                {value.columns.length < 8 && (
                  <button type="button" onClick={() => onChange({ ...value, columns: [...value.columns, "New"], rows: value.rows.map((r) => [...r, ""]) })} className="p-1 text-asur-slate hover:text-asur-white" aria-label="Add column">
                    <Plus size={14} />
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row, ri) => (
              <tr key={ri} className="border-t border-asur-graphite">
                {row.map((v, ci) => (
                  <td key={ci} className="p-1">
                    <input value={v} onChange={(e) => setCell(ri, ci, e.target.value)} className={cn(cell, ci === 0 && "font-medium")} aria-label={`${value.columns[ci]} row ${ri + 1}`} />
                  </td>
                ))}
                <td className="p-1">
                  <button type="button" onClick={() => onChange({ ...value, rows: value.rows.filter((_, i) => i !== ri) })} className="p-1 text-asur-slate hover:text-status-error" aria-label="Remove row">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange({ ...value, rows: [...value.rows, value.columns.map(() => "")] })} className="inline-flex items-center gap-1.5 text-caption text-accent-primary hover:underline">
          <Plus size={12} /> Add row
        </button>
        <button type="button" onClick={() => confirm("Remove the size chart?") && onChange(null)} className="text-caption text-asur-slate hover:text-status-error">
          Remove chart
        </button>
      </div>
      <input value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })} placeholder="Note shown above the chart" className={fieldClass} />
    </div>
  );
}
