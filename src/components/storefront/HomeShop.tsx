"use client";

// Product-first homepage blocks, modelled on how large activewear stores
// (Gymshark, YoungLA) merchandise: rails, tabs and dense grids, minimal copy.

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const container = "max-w-9xl mx-auto px-4 sm:px-6 lg:px-10";

function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { key: T; label: string; count?: number }[]; active: T; onChange: (k: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1.5 overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "shrink-0 h-9 px-4 rounded-full border text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors",
            active === t.key ? "bg-asur-bone text-asur-black border-asur-bone" : "border-asur-iron text-asur-silver hover:text-asur-white hover:border-asur-white"
          )}
        >
          {t.label}
          {typeof t.count === "number" && <span className="ml-1.5 opacity-60">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Horizontal, swipeable product rail with tabs (Gymshark "Popular right now"). */
export function ProductRail({
  title,
  tabs,
  bestSellerIds,
}: {
  title: string;
  tabs: { key: string; label: string; href: string; products: Product[] }[];
  bestSellerIds: string[];
}) {
  const available = tabs.filter((t) => t.products.length > 0);
  const [active, setActive] = useState(available[0]?.key ?? "");
  const scroller = useRef<HTMLDivElement>(null);
  if (!available.length) return null;
  const tab = available.find((t) => t.key === active) ?? available[0];

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="py-12 sm:py-16">
      <div className={cn(container, "flex flex-wrap items-end justify-between gap-4 mb-6")}>
        <div className="space-y-4 min-w-0">
          <h2 className="font-display condensed font-black uppercase text-asur-white leading-none text-4xl sm:text-5xl">{title}</h2>
          <Tabs
            tabs={available.map((t) => ({ key: t.key, label: t.label }))}
            active={tab.key}
            onChange={(k) => {
              setActive(k);
              scroller.current?.scrollTo({ left: 0 });
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Link href={tab.href} className="mr-2 text-[13px] font-medium uppercase tracking-[0.1em] text-asur-silver underline underline-offset-4 hover:text-asur-white">
            View all
          </Link>
          <button onClick={() => scroll(-1)} className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-asur-iron text-asur-white hover:border-asur-white" aria-label="Scroll left">
            <ArrowLeft size={16} />
          </button>
          <button onClick={() => scroll(1)} className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-asur-iron text-asur-white hover:border-asur-white" aria-label="Scroll right">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        role="tabpanel"
        className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-px-4 sm:scroll-px-6 lg:scroll-px-10 px-4 sm:px-6 lg:px-10 max-w-9xl mx-auto"
      >
        {tab.products.map((p, i) => (
          <div key={p.id} className="w-[46vw] sm:w-[32vw] lg:w-[calc((100%-3*1rem)/4.3)] shrink-0 snap-start">
            <ProductCard product={p} priority={i < 2} bestSeller={bestSellerIds.includes(p.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Dense product wall with category tabs (YoungLA-style). */
export function ProductWall({
  title,
  groups,
  bestSellerIds,
  limit = 12,
}: {
  title: string;
  groups: { key: string; label: string; href: string; products: Product[] }[];
  bestSellerIds: string[];
  limit?: number;
}) {
  const available = groups.filter((g) => g.products.length > 0);
  const [active, setActive] = useState(available[0]?.key ?? "");
  if (!available.length) return null;
  const group = available.find((g) => g.key === active) ?? available[0];
  const shown = group.products.slice(0, limit);

  return (
    <section className={cn(container, "py-12 sm:py-16")}>
      <div className="flex flex-col items-center text-center gap-5 mb-8">
        <h2 className="font-display condensed font-black uppercase text-asur-white leading-none text-4xl sm:text-5xl">{title}</h2>
        <Tabs tabs={available.map((g) => ({ key: g.key, label: g.label, count: g.products.length }))} active={group.key} onChange={setActive} />
      </div>
      <div role="tabpanel" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10">
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} bestSeller={bestSellerIds.includes(p.id)} />
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          href={group.href}
          className="inline-flex items-center gap-2 h-12 px-8 border border-asur-white text-asur-white text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white hover:text-asur-black transition-colors"
        >
          {group.products.length > shown.length ? `View all ${group.products.length}` : "Shop all"} {group.label === "All" ? "products" : group.label}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
