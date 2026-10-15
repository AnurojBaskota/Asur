import Image from "next/image";
import { cn } from "@/lib/utils";

// Blackletter wordmark. Source PNGs are 1200×398 with transparent backgrounds.
const RATIO = 1200 / 398;

export function Logo({
  height = 32,
  tone = "light",
  className,
  priority,
  eager,
}: {
  height?: number;
  tone?: "light" | "dark";
  className?: string;
  priority?: boolean;
  /** Load immediately even when off-screen (e.g. inside the print-only label sheet). */
  eager?: boolean;
}) {
  return (
    <Image
      src={tone === "light" ? "/brand/asur-logo-light.png" : "/brand/asur-logo-dark.png"}
      alt="ASUR"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      loading={priority ? undefined : eager ? "eager" : "lazy"}
      className={cn("h-auto select-none", className)}
      style={{ height, width: "auto" }}
    />
  );
}
