import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { StoreSettings } from "@/lib/settings";

export function Hero({ h }: { h: StoreSettings["hero"] }) {
  return (
    <section className="relative h-[100svh] min-h-[640px] max-h-[1100px] overflow-hidden bg-asur-black grain">
      <SmartImage
        src={h.image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[70%_15%] animate-[fadeIn_1.6s_ease-out]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-asur-black via-asur-black/30 to-asur-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-asur-black/70 via-transparent to-transparent" />

      <div className="relative z-10 h-full max-w-9xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col pt-32 pb-8 sm:pb-10">
        <div className="flex items-start justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-asur-ash">
          <p className="animate-slide-up">
            {h.eyebrow}
          </p>
          <p className="hidden sm:block text-right animate-slide-up">
            {h.sideNote}
            <br />
            <span className="text-asur-slate">{h.sideNoteSub}</span>
          </p>
        </div>

        <div className="mt-auto">
          <h1 className="font-display condensed font-black uppercase text-asur-white leading-[0.82] tracking-[-0.01em] text-[clamp(4.5rem,15vw,13.5rem)]">
            <span className="block animate-slide-up">{h.titleLine1}</span>
            <span className="block animate-slide-up [animation-delay:120ms] [animation-fill-mode:both]">
              {h.titleLine2}{h.titleLine2 && " "}<span className="text-transparent [-webkit-text-stroke:2px_var(--color-asur-white)]">{h.outlineWord}</span>
            </span>
          </h1>

          <div className="mt-8 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-md animate-fade-in [animation-delay:400ms] [animation-fill-mode:both]">
              <p className="text-[15px] sm:text-base leading-relaxed text-asur-ash">
                {h.subtitle}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={h.primaryHref}
                  className="group inline-flex items-center gap-3 bg-asur-bone text-asur-black pl-6 pr-5 h-12 text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white transition-colors"
                >
                  {h.primaryLabel}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href={h.secondaryHref}
                  className="inline-flex items-center h-12 px-6 border border-asur-white/30 text-asur-white text-[13px] font-semibold uppercase tracking-[0.12em] hover:border-asur-white hover:bg-white/5 transition-colors"
                >
                  {h.secondaryLabel}
                </Link>
              </div>
            </div>

            <a href="#featured" className="hidden lg:flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-asur-slate hover:text-asur-white transition-colors">
              Scroll to explore
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-asur-iron">
                <ArrowDown size={14} className="animate-bounce" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
