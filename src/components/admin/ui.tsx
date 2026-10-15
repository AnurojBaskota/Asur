import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full h-11 bg-asur-graphite border border-asur-iron rounded-md px-3.5 text-[15px] text-asur-white placeholder:text-asur-slate focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/40 transition-colors disabled:opacity-60 [&:is(textarea)]:h-auto [&:is(textarea)]:py-2.5";

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 mb-1.5">
      <span className="text-[14px] font-medium text-asur-ash">{children}</span>
      {hint && <span className="text-[12px] text-asur-slate">{hint}</span>}
    </label>
  );
}

export function Panel({ title, action, children, className }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("bg-asur-carbon border border-asur-graphite rounded-lg", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-asur-graphite">
          {title && <h2 className="text-[16px] font-semibold text-asur-white">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {back}
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-asur-white">{title}</h1>
          {subtitle && <p className="text-[15px] text-asur-silver mt-1">{subtitle}</p>}
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

const ORDER_TONE: Record<string, string> = {
  pending: "bg-status-warning/15 text-status-warning border-status-warning/25",
  confirmed: "bg-status-info/15 text-status-info border-status-info/25",
  processing: "bg-status-info/15 text-status-info border-status-info/25",
  ready_for_dispatch: "bg-accent-primary/15 text-accent-primary border-accent-primary/30",
  dispatched: "bg-accent-primary/15 text-accent-primary border-accent-primary/30",
  delivered: "bg-status-success/15 text-status-success border-status-success/25",
  cancelled: "bg-status-error/15 text-status-error border-status-error/25",
  returned: "bg-asur-iron/40 text-asur-silver border-asur-iron",
};

export function OrderStatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex px-2 py-0.5 text-caption font-medium border rounded-sm whitespace-nowrap", ORDER_TONE[status] ?? ORDER_TONE.returned)}>
      {label}
    </span>
  );
}

export function PaymentPill({ status }: { status: string }) {
  const cls =
    status === "paid" ? "text-status-success" : status === "refunded" ? "text-asur-silver" : "text-status-warning";
  return <span className={cn("text-caption font-medium capitalize", cls)}>{status === "pending" ? "Unpaid" : status}</span>;
}
