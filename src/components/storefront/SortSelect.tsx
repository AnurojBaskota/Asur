"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

export const SORTS = [
  { value: "", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="relative inline-flex items-center gap-2 text-[13px] text-asur-silver">
      <span className="hidden sm:inline">Sort</span>
      <select
        value={params.get("sort") ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set("sort", e.target.value);
          else next.delete("sort");
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        className="appearance-none bg-transparent border border-asur-iron pl-3 pr-9 h-10 text-[13px] text-asur-white focus:outline-none focus:border-asur-white cursor-pointer"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value} className="bg-asur-carbon">{s.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 text-asur-silver" />
    </label>
  );
}
