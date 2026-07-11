import { ClubKitRenderer } from "@/components/escudo/ClubKitRenderer";
import { cn, formatCOP } from "@/lib/utils";
import type { EscudoConfig, Player, Rarity } from "@/lib/game/types";

const RARITY_STYLES: Record<
  Rarity,
  {
    frame: string;
    panel: string;
    stripe: string;
    badge: string;
    label: string;
    position: string;
    name: string;
    meta: string;
    price: string;
  }
> = {
  bronce: {
    frame: "border-[#CD7F32] shadow-[0_0_12px_rgba(205,127,50,0.35)]",
    panel: "bg-presi-surface",
    stripe: "from-[#CD7F32]/35 via-[#CD7F32]/10 to-transparent",
    badge: "bg-[#CD7F32] text-white",
    label: "Bronce",
    position: "text-orange-300",
    name: "text-white",
    meta: "text-white/75",
    price: "text-orange-200",
  },
  plata: {
    frame: "border-gray-300/70 shadow-[0_0_12px_rgba(192,192,192,0.35)]",
    panel: "bg-presi-surface",
    stripe: "from-gray-300/30 via-gray-200/10 to-transparent",
    badge: "bg-gradient-to-r from-gray-200 to-gray-400 text-presi-bg",
    label: "Plata",
    position: "text-gray-200",
    name: "text-white",
    meta: "text-white/80",
    price: "text-gray-100",
  },
  oro: {
    frame: "border-presi-gold/90 shadow-[0_0_16px_rgba(245,197,24,0.45)]",
    panel: "bg-presi-surface",
    stripe: "from-presi-gold/35 via-amber-500/10 to-transparent",
    badge: "bg-presi-gold text-presi-bg",
    label: "Oro",
    position: "text-amber-200",
    name: "text-white",
    meta: "text-white/80",
    price: "text-presi-gold",
  },
  leyenda: {
    frame: "border-2 border-transparent p-[2px] legend-holo shadow-[0_0_18px_rgba(34,211,238,0.35)]",
    panel: "bg-presi-bg",
    stripe: "from-presi-cyan/30 via-presi-gold/15 to-transparent",
    badge: "bg-presi-navy text-presi-gold ring-1 ring-presi-gold/40",
    label: "Leyenda",
    position: "text-presi-cyan",
    name: "text-white",
    meta: "text-white/80",
    price: "text-presi-gold",
  },
};

export function PlayerCard({
  player,
  escudoConfig,
  selected,
  onClick,
  compact = false,
}: {
  player: Player;
  escudoConfig?: EscudoConfig | null;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const style = RARITY_STYLES[player.rareza];
  const isLegendFrame = player.rareza === "leyenda";
  const kitAreaHeight = compact ? "h-[5.5rem]" : "h-[7.5rem]";
  const kitSize = compact ? 56 : 72;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "geo-card relative w-full overflow-hidden text-left transition-transform",
        isLegendFrame ? style.frame : cn("border-2 bg-presi-surface", style.frame),
        selected && "scale-[1.02] ring-2 ring-presi-gold",
        onClick && "cursor-pointer hover:scale-[1.02]"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          isLegendFrame ? cn("geo-card border-0", style.panel) : style.panel
        )}
      >
        <div
          className={cn(
            "relative flex w-full items-center justify-center bg-gradient-to-b from-black/40 to-black/70",
            kitAreaHeight
          )}
        >
          <ClubKitRenderer config={escudoConfig} size={kitSize} />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b",
              style.stripe
            )}
          />
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm",
              style.position
            )}
          >
            {player.posicion}
          </span>
          <span
            className={cn(
              "absolute right-2 top-2 z-10 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase",
              style.badge
            )}
          >
            {style.label}
          </span>
        </div>

        <div className={cn("relative z-[1]", compact ? "space-y-0.5 p-2 pt-1.5" : "space-y-0.5 p-3 pt-2")}>
          <p
            className={cn(
              "font-bold leading-tight",
              style.name,
              compact ? "text-sm" : "text-base"
            )}
          >
            {player.nombre}
          </p>
          <p className={cn("text-xs leading-snug", style.meta)}>
            {player.equipo_real}
          </p>
          <p className={cn("text-sm font-semibold", style.price)}>
            {formatCOP(player.costo_base)}
          </p>
        </div>
      </div>
    </button>
  );
}
