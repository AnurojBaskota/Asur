import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full bg-asur-graphite border border-asur-iron px-3 py-2.5 text-body-sm text-asur-white placeholder:text-asur-slate focus:outline-none focus:border-asur-silver transition-colors disabled:opacity-60";

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 mb-1.5">
      <span className="text-caption text-asur-silver uppercase tracking-wider">{children}</span>
      {hint && <span className="text-[11px] text-asur-slate normal-case">{hint}</span>}
    </label>
  );
}

export function Panel({ title, action, children, className }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("bg-asur-carbon border border-asur-graphite", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-asur-graphite">
          {title && <h2 className="text-body-md font-medium text-asur-white">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div className="flex items-start gap-3">
        {back}
        <div>
          <h1 className="text-display-sm font-bold text-asur-white">{title}</h1>
          {subtitle && <p className="text-body-sm text-asur-silver mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <span>
        <span className="block text-body-sm text-asur-white">{label}</span>
        {description && <span className="block text-caption text-asur-slate">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-accent-primary" : "bg-asur-iron")}
      >
        <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-asur-white transition-transform", checked && "translate-x-4")} />
      </button>
    </label>
  );
}

export function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  const cls =
    stock <= 0 ? "bg-status-error/15 text-status-error border-status-error/25"
    : stock <= threshold ? "bg-status-warning/15 text-status-warning border-status-warning/25"
    : "bg-status-success/15 text-status-success border-status-success/25";
  const label = stock <= 0 ? "Out of stock" : stock <= threshold ? "Low stock" : "In stock";
  return <span className={cn("inline-flex px-2 py-0.5 text-caption font-medium border rounded-sm whitespace-nowrap", cls)}>{label}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active" ? "bg-status-success/15 text-status-success border-status-success/25"
    : status === "draft" ? "bg-status-warning/15 text-status-warning border-status-warning/25"
    : "bg-asur-iron/40 text-asur-silver border-asur-iron";
  return <span className={cn("inline-flex px-2 py-0.5 text-caption font-medium border rounded-sm capitalize", cls)}>{status}</span>;
}

export function EmptyState({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      <div className="text-asur-iron mb-4">{icon}</div>
      <p className="text-body-md text-asur-white">{title}</p>
      {children && <div className="text-body-sm text-asur-slate mt-1 max-w-sm">{children}</div>}
    </div>
  );
}
