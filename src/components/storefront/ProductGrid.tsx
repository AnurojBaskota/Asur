import { Suspense } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/storefront/Reveal";
import { SortSelect } from "@/components/storefront/SortSelect";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductListing({
  overline,
  title,
  description,
  image,
  products,
  filters,
}: {
  overline: string;
  title: string;
  description?: string | null;
  image?: string | null;
  products: Product[];
  filters: { label: string; href: string; active: boolean }[];
}) {
  return (
    <div>
      {/* Header */}
      <header className={cn("relative overflow-hidden", image ? "min-h-[34svh] flex items-end grain pt-[96px]" : "pt-[96px]")}>
        {image && (
          <>
            <SmartImage src={image} alt="" fill priority sizes="100vw" className="object-cover object-[50%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-asur-black via-asur-black/50 to-asur-black/20" />
          </>
        )}
        <div className="relative w-full max-w-9xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-6 sm:pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-primary mb-3">{overline}</p>
          <h1 className="font-display condensed font-black uppercase text-asur-white leading-[0.82] text-[clamp(3rem,7vw,6rem)]">
            {title}
          </h1>
          {description && <p className="mt-3 max-w-xl text-[15px] sm:text-base leading-relaxed text-asur-ash">{description}</p>}
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-[104px] z-20 bg-asur-black/90 backdrop-blur-md border-y border-asur-graphite">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
          <nav className="flex gap-1.5 overflow-x-auto no-scrollbar -ml-1 pl-1" aria-label="Filter products">
            {filters.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                aria-current={f.active ? "page" : undefined}
                className={cn(
                  "shrink-0 h-9 inline-flex items-center px-4 rounded-full border text-[12px] font-medium uppercase tracking-[0.1em] transition-colors",
                  f.active ? "bg-asur-bone text-asur-black border-asur-bone" : "border-asur-iron text-asur-silver hover:text-asur-white hover:border-asur-white"
                )}
              >
                {f.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline font-mono text-[11px] uppercase tracking-[0.14em] text-asur-slate">
              {products.length} {products.length === 1 ? "item" : "items"}
            </span>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-20 sm:pb-24">
        {products.length === 0 ? (
          <div className="py-28 text-center">
            <p className="font-display condensed font-black uppercase text-5xl text-asur-white">Nothing here yet</p>
            <p className="mt-3 text-[15px] text-asur-slate">Try another filter, or browse the full collection.</p>
            <Link href="/shop" className="mt-8 inline-flex items-center h-12 px-6 bg-asur-bone text-asur-black text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white">
              Shop all
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70}>
                <ProductCard product={p} priority={i < 4} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
