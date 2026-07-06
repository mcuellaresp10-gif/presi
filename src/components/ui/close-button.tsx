"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const variantStyles = {
  /** Encabezados de modales y menús sobre fondo oscuro */
  panel:
    "border border-white/20 bg-white/15 text-white shadow-md shadow-black/30 hover:bg-white/25 active:bg-white/30",
  /** Sobre gradientes o fotos (jugador, etc.) */
  overlay:
    "border border-white/30 bg-black/50 text-white shadow-lg shadow-black/40 backdrop-blur-sm hover:bg-black/65 active:bg-black/75",
  /** Avisos inline compactos */
  inline:
    "border border-white/15 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white active:bg-white/25",
} as const;

export function CloseButton({
  onClick,
  className,
  variant = "panel",
  label = "Cerrar",
  iconClassName,
}: {
  onClick: () => void;
  className?: string;
  variant?: keyof typeof variantStyles;
  label?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-presi-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-presi-surface",
        variantStyles[variant],
        className
      )}
    >
      <X className={cn("h-5 w-5 stroke-[2.5]", iconClassName)} />
    </button>
  );
}
