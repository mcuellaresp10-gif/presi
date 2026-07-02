"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Crown } from "lucide-react";
import {
  PointsBreakdownSheet,
  type GameweekPlayerBreakdown,
} from "@/components/scoring/PointsBreakdownSheet";
import { PlayerPhoto } from "@/components/plantilla/PlayerPhoto";
import { getGameweekPointsBreakdown } from "@/lib/actions/gameweek";

const SOURCE_LABEL: Record<GameweekPlayerBreakdown["source"], string> = {
  starter: "Titular",
  bench_sub: "Suplente",
  bench_boost: "Banca",
};

export function GameweekPointsPanel({
  gameweekId,
  gameweekRound,
  gameweekPoints,
}: {
  gameweekId: string | null;
  gameweekRound: number | null;
  gameweekPoints: number;
}) {
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<GameweekPlayerBreakdown[]>([]);
  const [selected, setSelected] = useState<GameweekPlayerBreakdown | null>(null);
  const [pending, startTransition] = useTransition();

  function openPanel() {
    if (!gameweekId) return;
    startTransition(async () => {
      const breakdown = await getGameweekPointsBreakdown(gameweekId);
      setPlayers(breakdown?.players ?? []);
      setSelected(null);
      setOpen(true);
    });
  }

  if (!gameweekRound) return null;

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        disabled={!gameweekId || pending}
        className="mt-2 w-full border-t border-white/20 pt-2 text-center text-xs font-semibold transition hover:opacity-80 disabled:opacity-60"
      >
        Jornada {gameweekRound}:{" "}
        <span className="font-black">
          {gameweekPoints.toLocaleString("es-CO")} pts
        </span>{" "}
        esta fecha
        {gameweekId && (
          <span className="ml-1 text-[10px] font-normal opacity-70">
            · ver desglose
          </span>
        )}
      </button>

      {open && !selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-presi-surface shadow-2xl">
            <div className="sticky top-0 border-b border-white/10 bg-presi-surface px-4 py-3">
              <h2 className="text-lg font-bold text-white">
                Puntos jornada {gameweekRound}
              </h2>
              <p className="text-xs text-white/60">
                Total: {gameweekPoints.toLocaleString("es-CO")} pts
              </p>
            </div>
            <ul className="divide-y divide-white/5 p-2">
              {players.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-white/50">
                  {pending
                    ? "Cargando desglose…"
                    : "Aún no hay puntos calculados para esta jornada."}
                </li>
              ) : (
                players.map((row) => (
                  <li key={row.playerId}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-white/5"
                      onClick={() => setSelected(row)}
                    >
                      {row.player ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15">
                          <PlayerPhoto
                            photoUrl={row.player.photo_url}
                            nombre={row.player.nombre}
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-white/10" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-white">
                            {row.player?.nombre ?? row.playerId}
                          </p>
                          {row.isCaptain && (
                            <Crown className="h-3.5 w-3.5 text-presi-gold" />
                          )}
                        </div>
                        <p className="text-[10px] text-white/50">
                          {SOURCE_LABEL[row.source]} · {row.minutes}&apos;
                        </p>
                      </div>
                      <span className="text-base font-black text-presi-cyan">
                        {row.points > 0 ? "+" : ""}
                        {row.points}
                      </span>
                      <ChevronRight className="h-4 w-4 text-white/30" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      <PointsBreakdownSheet
        open={open && !!selected}
        gameweekRound={gameweekRound}
        playerBreakdown={selected}
        onBack={() => setSelected(null)}
        onClose={() => {
          setSelected(null);
          setOpen(false);
        }}
      />
    </>
  );
}
