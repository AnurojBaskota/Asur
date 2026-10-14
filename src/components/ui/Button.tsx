import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary";

    const variants = {
      primary:
        "bg-asur-white text-asur-black hover:bg-asur-bone active:bg-asur-ash",
      secondary:
        "bg-asur-steel text-asur-white hover:bg-asur-iron active:bg-asur-slate",
      outline:
        "border border-asur-iron text-asur-white hover:border-asur-silver hover:text-asur-white active:bg-asur-steel",
      ghost:
        "text-asur-silver hover:text-asur-white hover:bg-asur-steel/50 active:bg-asur-steel",
      danger:
        "bg-status-error text-white hover:bg-status-error/90 active:bg-status-error/80",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-caption",
      md: "px-5 py-2.5 text-body-sm",
      lg: "px-7 py-3 text-body-md",
      xl: "px-9 py-4 text-body-md",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
