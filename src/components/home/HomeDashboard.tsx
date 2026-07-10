"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { LiveBadge } from "@/components/ui/live-badge";
import { Button } from "@/components/ui/button";
import type { EscudoConfig } from "@/lib/game/types";
import { Clock } from "lucide-react";
import { formatRemainingTime } from "@/lib/game";
import { gameweekPhaseLabel } from "@/lib/gameweek/status";
import { StadiumIncomePin } from "@/components/home/StadiumIncomePin";
import { HelpTip } from "@/components/help/HelpTip";

export function HomeDashboard({
  clubNombre,
  escudoConfig,
  seasonPoints,
  gameweekPoints,
  gameweekRound,
  gameweekStatus,
  deadlineAt,
  isLineupLocked,
  hasValidDraft,
  rivalNombre,
  rivalPoints,
  rivalEscudo,
  contractsExpiringSoon,
  nextIncomeTickAt,
  incomeIntervalHours,
  incomePerTick,
  gemsPerTick,
  pendingIncome,
  pendingGems,
  pendingTicks,
}: {
  clubNombre: string;
  escudoConfig: EscudoConfig;
  seasonPoints: number;
  gameweekPoints: number;
  gameweekRound: number | null;
  gameweekStatus: string | null;
  deadlineAt: string | null;
  isLineupLocked: boolean;
  hasValidDraft: boolean;
  rivalNombre: string | null;
  rivalPoints: number;
  rivalEscudo: EscudoConfig | null;
  contractsExpiringSoon: number;
  nextIncomeTickAt: string | null;
  incomeIntervalHours: number;
  incomePerTick: number;
  gemsPerTick: number;
  pendingIncome: number;
  pendingGems: number;
  pendingTicks: number;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const deadlineMs =
    now !== null && deadlineAt
      ? Math.max(0, new Date(deadlineAt).getTime() - now)
      : null;
  const deadlineCountdown =
    deadlineMs !== null ? formatRemainingTime(deadlineMs) : "—";

  const needsLineup = !hasValidDraft && !isLineupLocked && !!gameweekRound;
  const phase =
    gameweekStatus === "live" ||
    gameweekStatus === "upcoming" ||
    gameweekStatus === "finished"
      ? gameweekStatus
      : "upcoming";
  const live = phase === "live";
  const upcoming = phase === "upcoming";
  const phaseLabel = gameweekPhaseLabel(
    phase as "upcoming" | "live" | "finished"
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-presi-navy via-presi-bg to-presi-bg">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 80% 50% at 50% 55%, rgba(34,211,238,0.2) 0%, transparent 60%),
                radial-gradient(circle at 12% 18%, rgba(245,197,24,0.18) 0%, transparent 35%),
                radial-gradient(circle at 88% 22%, rgba(255,51,85,0.1) 0%, transparent 35%)
              `,
            }}
          />
          <div className="absolute inset-x-6 bottom-[28%] top-[32%] rounded-[50%] border-2 border-presi-cyan/25 bg-presi-navy/40 shadow-inner" />
          <div className="absolute left-1/2 top-[44%] h-1 w-2/5 -translate-x-1/2 border-t border-white/20" />
          <div className="absolute left-1/2 top-[44%] h-14 w-20 -translate-x-1/2 rounded border border-white/15" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pt-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-md">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center gap-1 text-center">
              <EscudoRenderer config={escudoConfig} size={36} />
              <p className="max-w-[7rem] truncate text-[10px] font-bold uppercase">
                {clubNombre}
              </p>
              <p className="text-2xl font-black text-display text-presi-gold">
                {gameweekPoints}
              </p>
              <p className="text-[9px] text-white/40">Jornada</p>
            </div>

            <div className="px-2 text-center">
              <p className="text-display text-lg text-white/30">VS</p>
              {gameweekRound ? (
                <p className="text-[9px] text-white/50">J{gameweekRound}</p>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-1 text-center">
              {rivalEscudo ? (
                <EscudoRenderer config={rivalEscudo} size={36} />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs">
                  ?
                </div>
              )}
              <p className="max-w-[7rem] truncate text-[10px] font-bold uppercase">
                {rivalNombre ?? "Rival"}
              </p>
              <p className="text-2xl font-black text-display text-white/80">
                {rivalPoints}
              </p>
              <p className="text-[9px] text-white/40">Temporada</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-xs">
            <LiveBadge
              live={live}
              label={phaseLabel}
              className={
                upcoming ? "bg-presi-gold/20 text-presi-gold" : undefined
              }
            />
            <Clock className="h-3.5 w-3.5 text-presi-gold" />
            <span className="text-white/80">
              {gameweekRound
                ? live
                  ? "Partidos en curso"
                  : upcoming
                    ? isLineupLocked
                      ? "Temporada por comenzar"
                      : gameweekRound === 1
                        ? `Primera fecha en ${deadlineCountdown}`
                        : `Próxima fecha en ${deadlineCountdown}`
                    : isLineupLocked
                      ? "Alineación bloqueada"
                      : `Cierra en ${deadlineCountdown}`
                : "Sin jornada activa"}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-white/40">
          <span>
            Temporada:{" "}
            <span className="font-bold text-presi-cyan">
              {seasonPoints.toLocaleString("es-CO")} pts
            </span>
          </span>
          <HelpTip sectionId="objetivo" />
        </div>

        <div className="flex flex-1 items-center justify-center py-6">
          <StadiumIncomePin
            escudoConfig={escudoConfig}
            nextIncomeTickAt={nextIncomeTickAt}
            incomeIntervalHours={incomeIntervalHours}
            incomePerTick={incomePerTick}
            gemsPerTick={gemsPerTick}
            pendingAmount={pendingIncome}
            pendingGems={pendingGems}
            pendingTicks={pendingTicks}
          />
        </div>

        <div className="space-y-2">
          {needsLineup ? (
            <Button asChild variant="cta" className="w-full">
              <Link href="/plantilla">Armar alineación</Link>
            </Button>
          ) : null}

          {contractsExpiringSoon > 0 ? (
            <p className="rounded-lg bg-presi-warning/10 px-3 py-2 text-center text-[10px] text-presi-warning">
              {contractsExpiringSoon} jugador
              {contractsExpiringSoon !== 1 ? "es" : ""} con contrato por vencer
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
