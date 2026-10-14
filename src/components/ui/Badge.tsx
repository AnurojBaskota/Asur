import { cn } from "@/lib/utils";
import { OrderStatus, PaymentStatus } from "@/types";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  size = "sm",
  children,
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-asur-steel text-asur-ash",
    success: "bg-status-success/15 text-status-success border border-status-success/20",
    warning: "bg-status-warning/15 text-status-warning border border-status-warning/20",
    error: "bg-status-error/15 text-status-error border border-status-error/20",
    info: "bg-status-info/15 text-status-info border border-status-info/20",
    neutral: "bg-asur-iron/50 text-asur-silver border border-asur-iron",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-caption",
    md: "px-3 py-1 text-body-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-sm",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Status-specific badge helpers
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { label: string; variant: BadgeProps["variant"] }> = {
    pending: { label: "Pending", variant: "warning" },
    confirmed: { label: "Confirmed", variant: "info" },
    processing: { label: "Processing", variant: "info" },
    ready_for_dispatch: { label: "Ready for Dispatch", variant: "success" },
    dispatched: { label: "Dispatched", variant: "success" },
    delivered: { label: "Delivered", variant: "success" },
    cancelled: { label: "Cancelled", variant: "error" },
    returned: { label: "Returned", variant: "neutral" },
  };

  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { label: string; variant: BadgeProps["variant"] }> = {
    pending: { label: "Pending", variant: "warning" },
    paid: { label: "Paid", variant: "success" },
    failed: { label: "Failed", variant: "error" },
    refunded: { label: "Refunded", variant: "neutral" },
    partially_refunded: { label: "Partial Refund", variant: "warning" },
  };

  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
