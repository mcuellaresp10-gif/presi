"use client";

import { useState } from "react";
import { PlayerCard } from "@/components/cards/PlayerCard";
import type { Player } from "@/lib/game/types";
import { Button } from "@/components/ui/button";

export function PackOpenAnimation({
  options,
  onSelect,
  packNumber,
}: {
  options: Player[];
  onSelect: (playerId: string) => void;
  packNumber: number;
}) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");

  if (phase === "closed") {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <button
          type="button"
          onClick={() => {
            setPhase("opening");
            setTimeout(() => setPhase("open"), 600);
          }}
          className="pack-closed relative h-48 w-36 cursor-pointer rounded-lg bg-gradient-to-br from-presi-navy to-presi-cyan shadow-xl transition-transform hover:scale-105"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
          <p className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold text-presi-gold">
            SOBRE {packNumber}/4
          </p>
        </button>
        <p className="text-sm text-white/70">Toca para abrir el sobre</p>
      </div>
    );
  }

  if (phase === "opening") {
    return (
      <div className="flex justify-center py-12">
        <div className="pack-opening h-48 w-36 rounded-lg bg-gradient-to-br from-presi-navy to-presi-cyan shadow-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <p className="text-center text-sm font-medium text-white">
        Elige 1 jugador de este sobre
      </p>
      {options.length === 0 ? (
        <p className="text-center text-sm text-red-600">
          No hay jugadores disponibles en este sobre.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {options.map((player, index) => (
            <div
              key={player.id}
              className="pack-card-reveal"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <PlayerCard
                player={player}
                onClick={() => onSelect(player.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PackCompleteMessage() {
  return (
    <div className="py-12 text-center">
      <p className="text-lg font-semibold text-white">
        ¡Sobres de bienvenida completados!
      </p>
      <Button asChild className="mt-4">
        <a href="/inicio">Ir al inicio</a>
      </Button>
    </div>
  );
}
