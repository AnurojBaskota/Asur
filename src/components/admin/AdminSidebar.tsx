"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FileText,
  FolderTree,
  Home,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  Plus,
  Printer,
  Settings,
  ShoppingBag,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/ui/Logo";

export type SidebarCounts = { toConfirm: number; toPack: number; lowStock: number };

type Item = { label: string; href: string; icon: typeof Home; badge?: number; badgeTone?: "red" | "amber"; exact?: boolean };

export function AdminSidebar({ email, counts }: { email: string; counts: SidebarCounts }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups: { heading?: string; items: Item[] }[] = [
    { items: [{ label: "Home", href: "/admin", icon: Home, exact: true }] },
    {
      heading: "Sell",
      items: [
        { label: "Orders", href: "/admin/orders", icon: ShoppingBag, badge: counts.toConfirm, badgeTone: "red" },
        { label: "Pack & ship", href: "/admin/dispatch", icon: PackageCheck, badge: counts.toPack, badgeTone: "amber" },
        { label: "Customers", href: "/admin/customers", icon: Users },
      ],
    },
    {
      heading: "Products",
      items: [
        { label: "All products", href: "/admin/products", icon: Package },
        { label: "Stock", href: "/admin/inventory", icon: Warehouse, badge: counts.lowStock, badgeTone: "amber", exact: true },
        { label: "Print labels", href: "/admin/inventory/barcodes", icon: Printer },
        { label: "Categories", href: "/admin/categories", icon: FolderTree },
      ],
    },
    {
      heading: "Website",
      items: [
        { label: "Homepage & settings", href: "/admin/settings", icon: Settings },
        { label: "Info pages", href: "/admin/pages", icon: FileText },
      ],
    },
  ];

  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 z-40 bg-asur-carbon border-b border-asur-graphite flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo height={22} /> <span className="text-[12px] text-asur-slate">Admin</span>
        </Link>
        <button onClick={() => setOpen(true)} className="relative p-2 text-asur-silver" aria-label="Open menu">
          <Menu size={22} />
          {counts.toConfirm + counts.toPack > 0 && <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-status-error" />}
        </button>
      </div>
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />}

      <aside
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-64 bg-asur-carbon border-r border-asur-graphite flex flex-col z-50 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-asur-graphite">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo height={26} />
            <span className="text-[12px] text-asur-slate">Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 text-asur-silver" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-4">
          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-2 h-11 rounded-md bg-asur-bone text-asur-black text-[14px] font-semibold hover:bg-asur-white transition-colors"
          >
            <Plus size={17} /> Add product
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar space-y-5">
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.heading && <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-asur-slate">{g.heading}</p>}
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 h-10 px-3 rounded-md text-[14px] transition-colors",
                          active ? "bg-asur-steel/70 text-asur-white font-medium" : "text-asur-silver hover:text-asur-white hover:bg-asur-steel/30"
                        )}
                      >
                        <Icon size={18} className={active ? "text-accent-primary" : ""} />
                        <span className="flex-1">{item.label}</span>
                        {!!item.badge && (
                          <span
                            className={cn(
                              "min-w-6 h-6 px-1.5 rounded-full text-[12px] font-bold flex items-center justify-center",
                              item.badgeTone === "red" ? "bg-status-error text-white" : "bg-status-warning/20 text-status-warning"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-2">
          <a href="/" target="_blank" className="flex items-center gap-3 h-10 px-3 rounded-md text-[14px] text-asur-silver hover:text-asur-white hover:bg-asur-steel/30">
            <ExternalLink size={18} /> View my store
          </a>
        </div>

        <div className="px-4 py-3 border-t border-asur-graphite flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-[13px] font-semibold uppercase text-accent-primary">
            {email[0]}
          </div>
          <p className="flex-1 min-w-0 truncate text-[13px] text-asur-silver">{email}</p>
          <form action={logout}>
            <button className="p-2 rounded-md text-asur-slate hover:text-asur-white hover:bg-asur-steel/30" aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
