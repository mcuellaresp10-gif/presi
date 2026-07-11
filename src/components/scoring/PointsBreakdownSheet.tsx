"use client";

import { ArrowLeft, Crown } from "lucide-react";
import { CloseButton } from "@/components/ui/close-button";
import { HelpTip } from "@/components/help/HelpTip";
import { ClubKitRenderer } from "@/components/escudo/ClubKitRenderer";
import type { ScoringBreakdownLine } from "@/lib/game/scoring";
import type { EscudoConfig, Player, Position } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export type GameweekPlayerBreakdown = {
  playerId: string;
  points: number;
  source: "starter" | "bench_sub" | "bench_boost";
  minutes: number;
  isCaptain?: boolean;
  lines?: ScoringBreakdownLine[];
  player?: Pick<Player, "id" | "nombre" | "posicion" | "photo_url" | "equipo_real">;
};

const SOURCE_LABEL: Record<GameweekPlayerBreakdown["source"], string> = {
  starter: "Titular",
  bench_sub: "Suplente (auto)",
  bench_boost: "Banca (boost)",
};

const POSITION_LABEL: Record<Position, string> = {
  GK: "Portero",
  DEF: "Defensa",
  MED: "Mediocampista",
  DEL: "Delantero",
};

function lineIcon(id: string): string {
  if (id.includes("goal")) return "⚽";
  if (id.includes("assist")) return "🅰️";
  if (id.includes("card") || id.includes("yellow") || id.includes("red")) return "🟨";
  if (id.includes("captain")) return "👑";
  if (id.includes("save")) return "🧤";
  if (id.includes("tackle")) return "🛡️";
  if (id.includes("pass")) return "📍";
  if (id.includes("win") || id.includes("draw")) return "🏆";
  if (id.includes("started")) return "👕";
  return "•";
}

export function PointsBreakdownSheet({
  open,
  gameweekRound,
  playerBreakdown,
  escudoConfig,
  onBack,
  onClose,
}: {
  open: boolean;
  gameweekRound: number | null;
  playerBreakdown: GameweekPlayerBreakdown | null;
  escudoConfig?: EscudoConfig | null;
  onBack: () => void;
  onClose: () => void;
}) {
  if (!open || !playerBreakdown) return null;

  const player = playerBreakdown.player;
  const lines = playerBreakdown.lines ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-presi-surface shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-presi-surface/95 px-4 py-3 backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-xs font-semibold text-presi-cyan hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <div className="flex items-center gap-1">
              <HelpTip sectionId="puntuacion" />
              <CloseButton onClick={onClose} className="-mr-1 shrink-0" />
            </div>
          </div>
          {gameweekRound && (
            <p className="text-[10px] uppercase tracking-widest text-white/50">
              Jornada {gameweekRound}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3">
            {player ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30">
                <ClubKitRenderer config={escudoConfig} size={48} />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-full bg-white/10" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold text-white">
                  {player?.nombre ?? "Jugador"}
                </h2>
                {playerBreakdown.isCaptain && (
                  <Crown className="h-4 w-4 shrink-0 text-presi-gold" />
                )}
              </div>
              <p className="text-xs text-white/60">
                {player ? POSITION_LABEL[player.posicion] : ""}
                {player?.equipo_real ? ` · ${player.equipo_real}` : ""}
              </p>
              <p className="text-[10px] text-presi-cyan/80">
                {SOURCE_LABEL[playerBreakdown.source]} · {playerBreakdown.minutes}&apos;
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="rounded-xl bg-gradient-to-r from-presi-cyan/20 to-presi-gold/20 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Total puntos
            </p>
            <p className="text-4xl font-black text-white">
              {playerBreakdown.points.toLocaleString("es-CO")}
            </p>
          </div>

          <ul className="mt-4 space-y-1">
            {lines.length === 0 ? (
              <li className="rounded-lg bg-white/5 px-3 py-4 text-center text-sm text-white/50">
                Sin desglose disponible para este jugador.
              </li>
            ) : (
              lines.map((line) => (
                <li
                  key={`${line.id}-${line.label}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/5"
                >
                  <span className="w-6 text-center text-base">
                    {lineIcon(line.id)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-white/90">
                    {line.label}
                    {line.count > 1 && (
                      <span className="ml-1 text-white/50">×{line.count}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      line.points > 0
                        ? "text-presi-cyan"
                        : line.points < 0
                          ? "text-red-400"
                          : "text-white/40"
                    )}
                  >
                    {line.points > 0 ? "+" : ""}
                    {line.points}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
