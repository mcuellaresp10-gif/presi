import { cn, formatCOP } from "@/lib/utils";
import type { Player, Rarity } from "@/lib/game/types";

const RARITY_STYLES: Record<
  Rarity,
  { border: string; badge: string; label: string }
> = {
  bronce: {
    border: "border-[#CD7F32] shadow-[0_0_12px_rgba(205,127,50,0.4)]",
    badge: "bg-[#CD7F32] text-white",
    label: "Bronce",
  },
  plata: {
    border:
      "border-transparent bg-gradient-to-br from-gray-200 via-white to-gray-400 shadow-[0_0_12px_rgba(192,192,192,0.5)]",
    badge: "bg-gradient-to-r from-gray-300 to-gray-500 text-white",
    label: "Plata",
  },
  oro: {
    border:
      "border-transparent bg-gradient-to-br from-[#C9A227] via-[#F4E4A6] to-[#8B6914] shadow-[0_0_16px_rgba(201,162,39,0.5)]",
    badge: "bg-[#C9A227] text-andes-deep",
    label: "Oro",
  },
  leyenda: {
    border: "border-2 border-transparent legend-holo",
    badge: "bg-andes-deep text-andes-gold",
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
        "relative w-full rounded-xl border-2 p-3 text-left transition-transform paper-texture",
        style.border,
        selected && "ring-2 ring-andes-gold scale-[1.02]",
        onClick && "cursor-pointer hover:scale-[1.02]",
        compact ? "p-2" : "p-3"
      )}
    >
      <span
        className={cn(
          "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
          style.badge
        )}
      >
        {style.label}
      </span>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-andes-deep/60">
          {player.posicion}
        </p>
        <p className={cn("font-bold text-andes-deep", compact ? "text-sm" : "text-base")}>
          {player.nombre}
        </p>
        <p className="text-xs text-andes-deep/70">{player.equipo_real}</p>
      </div>

      <p className="mt-2 text-sm font-semibold text-andes-accent">
        {formatCOP(player.costo_base)}
      </p>
    </button>
  );
}
