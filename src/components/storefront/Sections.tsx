import Link from "next/link";
import { ArrowRight, ArrowUpRight, RotateCcw, ShieldCheck, Truck, Mountain } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { NewsletterForm } from "@/components/storefront/NewsletterForm";
import { Reveal } from "@/components/storefront/Reveal";
import type { Product } from "@/types";
import type { StoreSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { getFooterPages, getSettings } from "@/lib/server/settings";

export type CategoryTile = { name: string; slug: string; image: string | null; description?: string | null; count: number };


/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.16em] text-accent-primary ${className}`}>{children}</p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow: string;
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <Reveal className="flex items-end justify-between gap-6 mb-10 sm:mb-14">
      <div>
        <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
        <h2 className="font-display condensed font-black uppercase text-asur-white leading-[0.85] text-[clamp(3rem,7vw,6.5rem)]">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden sm:inline-flex items-center gap-2 pb-1 border-b border-asur-iron text-[13px] font-medium uppercase tracking-[0.12em] text-asur-silver hover:text-asur-white hover:border-asur-white transition-colors whitespace-nowrap"
        >
          {linkLabel}
          <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </Reveal>
  );
}

const container = "max-w-9xl mx-auto px-4 sm:px-6 lg:px-10";

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

export function ValuesMarquee({ words }: { words: string[] }) {
  if (!words.length) return null;
  return (
    <div className="relative overflow-hidden border-y border-asur-graphite bg-asur-black py-5 sm:py-7" aria-hidden>
      <div className="flex w-max animate-marquee [animation-duration:55s]">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center">
            {[...words, ...words].map((w, i) => (
              <span key={i} className="flex items-center gap-8 px-8 font-display condensed font-black uppercase text-5xl sm:text-7xl leading-none">
                <span className={i % 2 ? "text-transparent [-webkit-text-stroke:1.5px_var(--color-asur-iron)]" : "text-asur-white"}>{w}</span>
                <span className="text-accent-primary text-3xl">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrustBar({ shipping }: { shipping: StoreSettings["shipping"] }) {
  const items = [
    shipping.freeThreshold > 0
      ? { icon: Truck, title: "Free shipping", text: `On orders above ${formatPrice(shipping.freeThreshold)}` }
      : { icon: Truck, title: "Free shipping", text: "On every order" },
    { icon: RotateCcw, title: `${shipping.returnDays}-day returns`, text: shipping.returnConditions },
    { icon: ShieldCheck, title: "Built to last", text: "Heavyweight cotton, built to train in" },
    { icon: Mountain, title: "Designed in Nepal", text: "Made for athletes everywhere" },
  ];
  return (
    <section className="border-b border-asur-graphite">
      <div className={`${container} grid grid-cols-2 lg:grid-cols-4`}>
        {items.map(({ icon: Icon, title, text }, i) => (
          <div
            key={title}
            className={`flex items-center gap-4 py-6 sm:py-8 ${i % 2 ? "pl-4 sm:pl-8" : "pr-4"} ${i > 0 ? "lg:pl-8 lg:border-l border-asur-graphite" : ""} ${i === 1 ? "border-l lg:border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""}`}
          >
            <Icon size={22} strokeWidth={1.5} className="shrink-0 text-accent-primary" />
            <div>
              <p className="text-[14px] font-medium text-asur-white">{title}</p>
              <p className="text-[12px] text-asur-slate">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedCollection({ products: featured }: { products: Product[] }) {
  if (!featured.length) return null;

  return (
    <section id="featured" className="py-20 sm:py-32 scroll-mt-24">
      <div className={container}>
        <SectionHeading eyebrow={`The Foundation Drop · ${featured.length} pieces`} title="Featured" href="/shop" linkLabel="Shop all" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 sm:gap-x-5">
          {featured.slice(0, 4).map((product, i) => (
            <Reveal key={product.id} delay={i * 90}>
              <ProductCard product={product} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Categories({ categories }: { categories: CategoryTile[] }) {
  if (!categories.length) return null;
  const cols = categories.length === 1 ? "md:grid-cols-1" : categories.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <section className="pb-20 sm:pb-32">
      <div className={container}>
        <SectionHeading eyebrow="Shop by category" title="The line" />
        <div className={`grid grid-cols-1 ${cols} gap-3 sm:gap-5`}>
          {categories.map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 120}>
              <Link href={`/category/${cat.slug}`} className="group relative block aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-asur-graphite grain">
                {cat.image && (
                  <SmartImage
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-asur-black via-asur-black/10 to-transparent" />
                <span className="absolute top-5 left-5 font-mono text-[11px] uppercase tracking-[0.16em] text-asur-white/80">
                  {String(i + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <h3 className="font-display condensed font-black uppercase text-asur-white leading-[0.85] text-[clamp(3rem,6vw,5.5rem)]">
                    {cat.name}
                  </h3>
                  {cat.description && <p className="mt-3 max-w-sm text-[14px] text-asur-ash line-clamp-2">{cat.description}</p>}
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-asur-silver">
                      {cat.count} {cat.count === 1 ? "style" : "styles"}
                    </span>
                    <span className="inline-flex items-center gap-2 h-11 px-5 bg-asur-bone text-asur-black text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors group-hover:bg-accent-primary">
                      Shop now <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CampaignSection({ c }: { c: StoreSettings["campaign"] }) {
  if (!c.enabled) return null;
  return (
    <section className="relative overflow-hidden bg-asur-carbon">
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[820px] grain">
          <SmartImage
            src={c.image}
            alt={c.caption || c.title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute bottom-5 left-5 font-mono text-[11px] uppercase tracking-[0.16em] text-asur-white/70">
            {c.caption}
          </span>
        </div>
        <div className="flex items-center px-5 py-16 sm:px-12 lg:px-20">
          <Reveal className="max-w-xl">
            <Eyebrow className="mb-6">{c.eyebrow}</Eyebrow>
            <h2 className="font-display condensed font-black uppercase text-asur-white leading-[0.85] text-[clamp(3.25rem,6.5vw,6.5rem)]">
              {c.title}{" "}
              <span className="text-transparent [-webkit-text-stroke:2px_var(--color-accent-primary)]">{c.outlineWord}</span>
            </h2>
            <p className="mt-8 text-[16px] leading-relaxed text-asur-ash">{c.body}</p>
            <Link
              href={c.ctaHref}
              className="group mt-10 inline-flex items-center gap-3 h-12 pl-6 pr-5 bg-asur-bone text-asur-black text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white transition-colors"
            >
              {c.ctaLabel}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function CraftSection({ c }: { c: StoreSettings["craft"] }) {
  if (!c.enabled) return null;
  const specs = c.specs;
  return (
    <section className="py-20 sm:py-32 border-b border-asur-graphite">
      <div className={container}>
        <div className="grid lg:grid-cols-12 gap-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow className="mb-3">{c.eyebrow}</Eyebrow>
            <h2 className="font-display condensed font-black uppercase text-asur-white leading-[0.85] text-[clamp(3rem,6vw,5.5rem)]">
              {c.title}
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-asur-silver">{c.body}</p>
          </Reveal>
          <div className="lg:col-span-8 grid sm:grid-cols-2 border-t border-l border-asur-graphite">
            {specs.map((s, i) => (
              <Reveal key={`${s.title}-${i}`} delay={i * 80} className="border-r border-b border-asur-graphite p-6 sm:p-8">
                <p className="font-display condensed font-black text-asur-white leading-none text-7xl sm:text-8xl">
                  {s.value}
                  <span className="ml-1 font-mono text-sm font-medium text-accent-primary align-top">{s.unit}</span>
                </p>
                <p className="mt-6 text-[15px] font-medium text-asur-white">{s.title}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-asur-slate">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewArrivals({ products: newProducts }: { products: Product[] }) {
  if (!newProducts.length) return null;

  return (
    <section className="py-20 sm:py-32">
      <div className={container}>
        <SectionHeading eyebrow="Just dropped" title="New in" href="/shop?filter=new" />
      </div>
      {/* Horizontal rail on mobile, grid on desktop */}
      <div className="flex lg:grid lg:grid-cols-4 gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 sm:px-6 lg:px-10 max-w-9xl mx-auto">
        {newProducts.slice(0, 4).map((product, i) => (
          <Reveal key={product.id} delay={i * 90} className="w-[72vw] sm:w-[44vw] lg:w-auto shrink-0 snap-start">
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function BrandStory({ c }: { c: StoreSettings["story"] }) {
  if (!c.enabled) return null;
  return (
    <section className="relative min-h-[90svh] flex items-end overflow-hidden grain">
      <SmartImage
        src={c.image}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-asur-black via-asur-black/60 to-asur-black/10" />
      <div className={`${container} relative w-full py-20 sm:py-28`}>
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <Reveal className="lg:col-span-7">
            <Eyebrow className="mb-4">{c.eyebrow}</Eyebrow>
            <h2 className="font-display condensed font-black uppercase text-asur-white leading-[0.85] text-[clamp(3.5rem,8vw,8rem)]">
              {c.title}
            </h2>
          </Reveal>
          <Reveal delay={150} className="lg:col-span-5 space-y-5 text-[15px] leading-relaxed text-asur-ash">
            {c.paragraphs.map((para, i) => <p key={i}>{para}</p>)}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
              {c.values.map((v) => (
                <p key={v} className="font-display condensed font-black uppercase text-3xl text-asur-white">{v}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Newsletter({ c }: { c: StoreSettings["newsletter"] }) {
  if (!c.enabled) return null;
  return (
    <section className="py-20 sm:py-32 bg-asur-bone text-asur-black">
      <div className={`${container} grid lg:grid-cols-2 gap-10 items-end`}>
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-secondary mb-4">{c.eyebrow}</p>
          <h2 className="font-display condensed font-black uppercase leading-[0.85] text-[clamp(3.25rem,7vw,7rem)]">
            {c.title}
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="text-[16px] text-asur-steel mb-6 max-w-md">{c.body}</p>
          <NewsletterForm />
          <p className="mt-3 text-[12px] text-asur-slate">No spam. Unsubscribe anytime.</p>
        </Reveal>
      </div>
    </section>
  );
}

export async function Footer() {
  const [{ brand }, pages] = await Promise.all([getSettings(), getFooterPages()]);
  const socials = [
    { label: "Instagram", href: brand.instagram },
    { label: "TikTok", href: brand.tiktok },
    { label: "Facebook", href: brand.facebook },
  ].filter((l) => l.href);
  const cols = [
    {
      title: "Shop",
      links: [
        { label: "Shop all", href: "/shop" },
        { label: "New in", href: "/shop?filter=new" },
        { label: "Sale", href: "/shop?filter=sale" },
      ],
    },
    { title: "Help", links: pages.map((p) => ({ label: p.title, href: `/pages/${p.slug}` })) },
    {
      title: "Contact",
      links: [
        ...(brand.contactEmail ? [{ label: brand.contactEmail, href: `mailto:${brand.contactEmail}` }] : []),
        ...(brand.contactPhone ? [{ label: brand.contactPhone, href: `tel:${brand.contactPhone.replace(/\s/g, "")}` }] : []),
        ...socials,
      ],
    },
  ].filter((c) => c.links.length);

  return (
    <footer className="bg-asur-black border-t border-asur-graphite overflow-hidden">
      <div className={`${container} pt-16 sm:pt-24`}>
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10">
          <div className="col-span-2 md:col-span-5">
            <p className="font-display condensed font-black text-3xl tracking-[0.08em] text-asur-white">{brand.name}</p>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-asur-slate">{brand.footerText}</p>
          </div>
          {cols.map((col) => (
            <div key={col.title} className="md:col-span-2 last:col-span-2 md:last:col-span-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-asur-silver mb-5">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[14px] text-asur-slate hover:text-asur-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col sm:flex-row justify-between gap-3 py-6 border-t border-asur-graphite font-mono text-[11px] uppercase tracking-[0.14em] text-asur-slate">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p>Prices in NPR · Nepal</p>
        </div>
      </div>
      <p
        aria-hidden
        className="select-none text-center font-display condensed font-black uppercase leading-[0.72] text-asur-graphite text-[34vw] -mb-[4vw]"
      >
        {brand.name}
      </p>
    </footer>
  );
}
