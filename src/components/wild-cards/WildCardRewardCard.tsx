"use client";

import { getWildCardDefinition } from "@/lib/game/wild-cards";
import type { WildCardType } from "@/lib/game/wild-cards";
import { cn } from "@/lib/utils";

export function WildCardRewardCard({
  cardType,
  className,
}: {
  cardType: WildCardType;
  className?: string;
}) {
  const card = getWildCardDefinition(cardType);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/20 p-4 text-white shadow-lg",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90",
          card.color
        )}
      />
      <div className="relative z-10 space-y-2 text-center">
        <p className="text-3xl">{card.icon}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">
          Wild Card
        </p>
        <p className="text-lg font-black uppercase leading-tight">{card.name}</p>
        <p className="text-[11px] leading-snug text-white/85">{card.description}</p>
      </div>
    </div>
  );
}

export function WildCardTile({
  cardType,
  status,
  onActivate,
  loading,
}: {
  cardType: WildCardType;
  status: "available" | "active" | "used";
  onActivate?: () => void;
  loading?: boolean;
}) {
  const card = getWildCardDefinition(cardType);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-sm">
      <div
        className={cn(
          "bg-gradient-to-br px-3 py-4 text-white",
          card.color
        )}
      >
        <p className="text-2xl">{card.icon}</p>
        <p className="mt-1 text-sm font-black uppercase">{card.name}</p>
      </div>
      <div className="space-y-2 p-3">
        <p className="text-xs text-white/70">{card.description}</p>
        {status === "active" ? (
          <p className="rounded-md bg-presi-cyan/20 px-2 py-1 text-center text-xs font-semibold text-presi-cyan">
            Activa esta jornada
          </p>
        ) : onActivate ? (
          <button
            type="button"
            onClick={onActivate}
            disabled={loading}
            className="w-full rounded-md bg-presi-cyan px-3 py-2 text-xs font-bold text-white hover:bg-presi-cyan/90 disabled:opacity-50"
          >
            {loading ? "..." : "Activar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
