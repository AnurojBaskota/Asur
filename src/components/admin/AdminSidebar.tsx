"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  FolderTree,
  Users,
  Settings,
  FileText,
  ChevronDown,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { logout } from "@/app/admin/actions";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    children: [
      { label: "All orders", href: "/admin/orders" },
      { label: "Awaiting confirmation", href: "/admin/orders?status=pending" },
      { label: "Pack & dispatch", href: "/admin/dispatch" },
    ],
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    label: "Products",
    icon: Package,
    children: [
      { label: "All Products", href: "/admin/products" },
      { label: "Add Product", href: "/admin/products/new" },
    ],
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Inventory",
    icon: Warehouse,
    children: [
      { label: "Stock Levels", href: "/admin/inventory" },
      { label: "Barcodes & Labels", href: "/admin/inventory/barcodes" },
    ],
  },
  {
    label: "Store settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    label: "Pages",
    href: "/admin/pages",
    icon: FileText,
  },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Orders", "Products", "Inventory"]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <>
    {/* Mobile top bar */}
    <div className="lg:hidden fixed top-0 inset-x-0 h-14 z-40 bg-asur-carbon border-b border-asur-graphite flex items-center justify-between px-4">
      <span className="text-heading-sm font-bold tracking-[0.15em] text-asur-white">ASUR <span className="text-caption text-asur-slate font-normal tracking-wider">ADMIN</span></span>
      <button onClick={() => setMobileOpen(true)} className="p-2 text-asur-silver" aria-label="Open menu"><Menu size={20} /></button>
    </div>
    {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />}
    <aside
      onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setMobileOpen(false); }}
      className={cn(
        "fixed top-0 left-0 bottom-0 w-64 bg-asur-carbon border-r border-asur-graphite flex flex-col z-50 transition-transform lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="relative px-6 py-5 border-b border-asur-graphite">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="text-heading-md font-bold tracking-[0.15em] text-asur-white">
            ASUR
          </span>
          <span className="text-caption text-asur-slate uppercase tracking-wider">
            Admin
          </span>
        </Link>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden absolute top-4 right-3 p-1.5 text-asur-silver" aria-label="Close menu"><X size={18} /></button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.href
              ? item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
              : item.children?.some((child) => pathname === child.href.split("?")[0]);
            const isExpanded = expandedItems.includes(item.label);

            if (item.children) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-body-sm transition-colors",
                      isActive
                        ? "text-asur-white"
                        : "text-asur-silver hover:text-asur-white hover:bg-asur-steel/30"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} />
                      {item.label}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <ul className="ml-7 mt-0.5 space-y-0.5 border-l border-asur-iron/50 pl-3">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href.split("?")[0];
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block px-3 py-1.5 rounded-sm text-body-sm transition-colors",
                                childActive
                                  ? "text-accent-primary"
                                  : "text-asur-slate hover:text-asur-white"
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.label}>
                <Link
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-sm text-body-sm transition-colors",
                    isActive
                      ? "text-asur-white bg-asur-steel/50"
                      : "text-asur-silver hover:text-asur-white hover:bg-asur-steel/30"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-2">
        <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 text-body-sm text-asur-silver hover:text-asur-white transition-colors">
          <ExternalLink size={16} /> View store
        </Link>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-asur-graphite">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center">
            <span className="text-caption font-medium text-accent-primary uppercase">{email[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm text-asur-white truncate">Admin</p>
            <p className="text-caption text-asur-slate truncate">{email}</p>
          </div>
          <form action={logout}>
            <button className="p-1.5 text-asur-slate hover:text-asur-white transition-colors" aria-label="Sign out" title="Sign out">
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </aside>
    </>
  );
}
