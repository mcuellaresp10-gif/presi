import { cn, formatCOP } from "@/lib/utils";
import type { Player, Rarity } from "@/lib/game/types";

const RARITY_STYLES: Record<
  Rarity,
  { border: string; badge: string; label: string }
> = {
  bronce: {
    border: "border-[#CD7F32] shadow-[0_0_12px_rgba(205,127,50,0.35)]",
    badge: "bg-[#CD7F32] text-white",
    label: "Bronce",
  },
  plata: {
    border:
      "border-transparent bg-gradient-to-br from-gray-300 via-white to-gray-500 shadow-[0_0_12px_rgba(192,192,192,0.4)]",
    badge: "bg-gradient-to-r from-gray-300 to-gray-500 text-presi-bg",
    label: "Plata",
  },
  oro: {
    border:
      "border-transparent bg-gradient-to-br from-presi-gold via-yellow-200 to-amber-700 shadow-[0_0_16px_rgba(245,197,24,0.45)]",
    badge: "bg-presi-gold text-presi-bg",
    label: "Oro",
  },
  leyenda: {
    border: "border-2 border-transparent legend-holo",
    badge: "bg-presi-navy text-presi-gold",
    label: "Leyenda",
  },
};

export function PlayerCard({
  player,
  selected,
  onClick,
  compact = false,
}: {
  player: Player;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const style = RARITY_STYLES[player.rareza];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "geo-card relative w-full border-2 bg-presi-surface p-3 text-left transition-transform",
        style.border,
        selected && "scale-[1.02] ring-2 ring-presi-gold",
        onClick && "cursor-pointer hover:scale-[1.02]",
        compact ? "p-2" : "p-3"
      )}
    >
      <span
        className={cn(
          "absolute right-2 top-2 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase",
          style.badge
        )}
      >
        {style.label}
      </span>

      <div className="mt-4">
        <p className="text-display text-xs text-presi-cyan">{player.posicion}</p>
        <p className={cn("font-bold text-white", compact ? "text-sm" : "text-base")}>
          {player.nombre}
        </p>
        <p className="text-xs text-white/70">{player.equipo_real}</p>
      </div>

      <p className="mt-2 text-sm font-semibold text-presi-gold">
        {formatCOP(player.costo_base)}
      </p>
    </button>
  );
}
