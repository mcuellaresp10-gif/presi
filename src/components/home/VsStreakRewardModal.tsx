"use client";

import { useTransition } from "react";
import { Gem, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dismissVsStreakReward } from "@/lib/actions/vs-rewards";
import type { VsStreakRewardPayload } from "@/lib/gameweek/vs-settle";
import { WILD_CARD_CATALOG } from "@/lib/game/wild-cards";
import type { WildCardType } from "@/lib/game/wild-cards";

export function VsStreakRewardModal({
  reward,
  onDismissed,
}: {
  reward: VsStreakRewardPayload;
  onDismissed?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const wcLabel =
    WILD_CARD_CATALOG[reward.wildCardType as WildCardType]?.name ??
    reward.wildCardType;

  function dismiss() {
    startTransition(async () => {
      await dismissVsStreakReward();
      onDismissed?.();
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
      />
      <div className="relative z-10 m-4 w-full max-w-md rounded-2xl border border-presi-gold/40 bg-presi-surface p-5 shadow-2xl">
        <div className="mb-3 flex items-center gap-2 text-presi-gold">
          <Trophy className="h-5 w-5" />
          <h2 className="text-display text-xl">¡Racha de 5!</h2>
        </div>
        <p className="text-sm text-presi-sand/80">
          Ganaste 5 jornadas VS al hilo. Abriste un sobre especial.
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <Gem className="h-4 w-4 text-presi-gold" />
            +{reward.gemsFromWin} gemas por la 5ª victoria
          </li>
          <li className="rounded-lg bg-white/5 px-3 py-2">
            Wild Card:{" "}
            <span className="font-semibold text-presi-gold">{wcLabel}</span>
          </li>
          {reward.players.map((p) => (
            <li
              key={p.id}
              className="rounded-lg bg-white/5 px-3 py-2"
            >
              {p.nombre}{" "}
              <span className="text-white/50">
                · {p.posicion} · {p.rareza}
              </span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          variant="cta"
          className="mt-5 w-full"
          disabled={pending}
          onClick={dismiss}
        >
          {pending ? "Guardando..." : "¡Genial!"}
        </Button>
      </div>
    </div>
  );
}
