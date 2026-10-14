import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-body-sm text-asur-silver uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full bg-asur-graphite border border-asur-iron px-4 py-3 text-body-md text-asur-white placeholder:text-asur-slate transition-colors duration-200",
            "focus:outline-none focus:border-asur-silver",
            error && "border-status-error focus:border-status-error",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-caption text-status-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-caption text-asur-slate">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
