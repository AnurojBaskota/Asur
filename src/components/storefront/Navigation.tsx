"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { cn } from "@/lib/utils";


const subscribeNoop = () => () => {};
/** True only after hydration, so persisted cart counts don't cause mismatches. */
function useHydrated() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export function Navigation({ categories, announcements }: { categories: { name: string; slug: string }[]; announcements: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartStore((s) => s.openCart);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const links = [
    { label: "Shop All", href: "/shop" },
    ...categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
    { label: "New In", href: "/shop?filter=new" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close overlays on route change and lock scroll while open
  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMenuOpen(false); setSearchOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const transparent = pathname === "/" && !scrolled && !menuOpen;
  const isActive = (href: string) => href.split("?")[0] === pathname && !href.includes("?");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {/* Ticker */}
        {announcements.length > 0 && <div className="h-8 overflow-hidden bg-asur-bone text-asur-black">
          <div className="flex w-max animate-marquee">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
                {[...announcements, ...announcements].map((t, i) => (
                  <span key={i} className="flex items-center gap-6 px-6 h-8 font-mono text-[11px] uppercase tracking-[0.14em] whitespace-nowrap">
                    {t} <span className="text-accent-secondary">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>}

        {/* Main bar */}
        <div
          className={cn(
            "transition-colors duration-500",
            transparent ? "bg-transparent" : "bg-asur-black/90 backdrop-blur-md border-b border-white/5"
          )}
        >
          <nav className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-10 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="lg:hidden -ml-2 p-2 text-asur-white"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <ul className="hidden lg:flex items-center gap-8">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "relative text-[13px] font-medium uppercase tracking-[0.12em] text-asur-white/80 hover:text-asur-white transition-colors",
                        "after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-asur-white after:transition-transform hover:after:scale-x-100",
                        isActive(l.href) && "text-asur-white after:scale-x-100"
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/" className="font-display condensed font-black text-[32px] leading-none tracking-[0.08em] text-asur-white" aria-label="ASUR home">
              ASUR
            </Link>

            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <button onClick={() => setSearchOpen(true)} className="p-2 text-asur-white/80 hover:text-asur-white" aria-label="Search">
                <Search size={20} />
              </button>
              <button onClick={openCart} className="relative p-2 text-asur-white/80 hover:text-asur-white" aria-label={`Cart, ${hydrated ? itemCount : 0} items`}>
                <ShoppingBag size={20} />
                {hydrated && itemCount > 0 && (
                  <span className="absolute top-0.5 right-0 min-w-[18px] h-[18px] px-1 bg-accent-primary text-asur-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-asur-black lg:hidden transition-[opacity,visibility] duration-300",
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
      >
        <div className="flex h-full flex-col px-5 pt-32 pb-10">
          <ul className="space-y-1">
            {links.map((l, i) => (
              <li
                key={l.href}
                className={cn("transition-all duration-500", menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}
                style={{ transitionDelay: menuOpen ? `${80 + i * 50}ms` : "0ms" }}
              >
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 border-b border-asur-graphite font-display condensed font-extrabold uppercase text-5xl text-asur-white"
                >
                  {l.label}
                  <ArrowRight size={22} className="text-asur-slate" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-auto font-mono text-[11px] uppercase tracking-[0.14em] text-asur-slate">
            Strength · Discipline · Identity
          </p>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-asur-black/95 backdrop-blur-sm animate-fade-in">
          <div className="max-w-4xl mx-auto px-5 pt-28 sm:pt-40">
            <div className="flex items-center justify-between mb-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-asur-slate">Search the store</p>
              <button onClick={() => setSearchOpen(false)} className="p-2 -mr-2 text-asur-silver hover:text-asur-white" aria-label="Close search">
                <X size={22} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q")?.toString().trim();
                if (!q) return;
                setSearchOpen(false);
                router.push(`/shop?q=${encodeURIComponent(q)}`);
              }}
              className="flex items-center gap-4 border-b-2 border-asur-white pb-3"
            >
              <Search size={28} className="text-asur-slate shrink-0" />
              <input
                name="q"
                type="search"
                autoFocus
                placeholder="Oversized tee, sleeveless…"
                aria-label="Search products"
                className="w-full bg-transparent font-display condensed font-bold uppercase text-4xl sm:text-6xl text-asur-white placeholder:text-asur-iron focus:outline-none"
              />
            </form>
            <div className="mt-10 flex flex-wrap gap-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setSearchOpen(false)}
                  className="px-4 py-2 border border-asur-iron text-[13px] uppercase tracking-[0.1em] text-asur-silver hover:text-asur-white hover:border-asur-white transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
