import Image from "next/image";
import { cn } from "@/lib/utils";

// Blackletter wordmark. Source PNGs are 1200×398 with transparent backgrounds.
const RATIO = 1200 / 398;

export function Logo({
  height = 32,
  tone = "light",
  className,
  priority,
}: {
  height?: number;
  tone?: "light" | "dark";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={tone === "light" ? "/brand/asur-logo-light.png" : "/brand/asur-logo-dark.png"}
      alt="ASUR"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={cn("h-auto select-none", className)}
      style={{ height, width: "auto" }}
    />
  );
}
