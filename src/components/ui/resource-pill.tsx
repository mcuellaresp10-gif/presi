import * as React from "react";
import { cn } from "@/lib/utils";

type PillVariant = "gold" | "cyan" | "gem" | "muted";

const dotColors: Record<PillVariant, string> = {
  gold: "text-presi-gold",
  cyan: "text-presi-gold",
  gem: "text-presi-gold",
  muted: "text-white/50",
};

export function ResourcePill({
  icon,
  label,
  variant = "gold",
  className,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  variant?: PillVariant;
  className?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur",
        onClick && "transition-colors hover:bg-black/70",
        className
      )}
    >
      {icon ?? <span className={dotColors[variant]}>●</span>}
      <span className="tabular-nums">{label}</span>
    </Comp>
  );
}
