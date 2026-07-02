"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import type { EscudoConfig } from "@/lib/game/types";
import { formatCOP } from "@/lib/utils";
import { Clock, Zap } from "lucide-react";
import { formatRemainingTime, getWildCardDefinition } from "@/lib/game";
import type { ScoutingUIState } from "@/components/scouting/ScoutingPackCard";
import { GameweekPointsPanel } from "@/components/scoring/GameweekPointsPanel";
import { PassiveIncomeBanner } from "@/components/facilities/PassiveIncomeBanner";

export function HomeDashboard({
  clubNombre,
  escudoConfig,
  presupuesto,
  seasonPoints,
  gameweekPoints,
  gameweekRound,
  gameweekId,
  gameweekStatus,
  deadlineAt,
  isLineupLocked,
  hasValidDraft,
  scoutingState,
  pendingIncome,
  pendingGems,
  pendingTicks,
  incomePerTick,
  gemsPerTick,
  incomeIntervalHours,
  nextIncomeTickAt,
  weeklyIncome,
  weeklyGems,
  gymBonusPct,
  contractsExpiringSoon,
}: {
  clubNombre: string;
  escudoConfig: EscudoConfig;
  presupuesto: number;
  seasonPoints: number;
  gameweekPoints: number;
  gameweekRound: number | null;
  gameweekId: string | null;
  gameweekStatus: string | null;
  deadlineAt: string | null;
  isLineupLocked: boolean;
  hasValidDraft: boolean;
  scoutingState: ScoutingUIState;
  pendingIncome: number;
  pendingGems: number;
  pendingTicks: number;
  incomePerTick: number;
  gemsPerTick: number;
  incomeIntervalHours: number;
  nextIncomeTickAt: string | null;
  weeklyIncome: number;
  weeklyGems: number;
  gymBonusPct: number;
  contractsExpiringSoon: number;
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

  const scoutingWildCardReady =
    scoutingState.estado === "listo" && !!scoutingState.wildCardType;
  const scoutingPlayerReady =
    scoutingState.estado === "listo" && !!scoutingState.player;
  const scoutingReady = scoutingWildCardReady || scoutingPlayerReady;
  const scoutingRemainingMs =
    now !== null
      ? Math.max(0, new Date(scoutingState.generaEn).getTime() - now)
      : null;
  const scoutingCountdown =
    scoutingRemainingMs !== null
      ? formatRemainingTime(scoutingRemainingMs)
      : "—";

  return (
    <div className="relative -mx-4 -mt-6 min-h-[calc(100vh-8rem)] overflow-hidden md:mx-0 md:mt-0 md:min-h-[calc(100vh-10rem)] md:rounded-xl">
      {/* Stadium background */}
      <div className="absolute inset-0 bg-gradient-to-b from-presi-navy via-presi-bg to-presi-bg">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 50% at 50% 60%, rgba(34,211,238,0.25) 0%, transparent 60%),
              radial-gradient(circle at 15% 20%, rgba(245,197,24,0.2) 0%, transparent 35%),
              radial-gradient(circle at 85% 25%, rgba(255,51,85,0.12) 0%, transparent 35%)
            `,
          }}
        />
        <div className="absolute inset-x-8 bottom-1/4 top-1/3 rounded-[50%] border-2 border-presi-cyan/20 bg-presi-navy/50 shadow-inner" />
        <div className="absolute left-1/2 top-[42%] h-1 w-1/3 -translate-x-1/2 border-t border-white/20" />
        <div className="absolute left-1/2 top-[42%] h-16 w-24 -translate-x-1/2 rounded border border-white/15" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-8rem)] flex-col p-4">
        {/* Resource pills */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <span className="text-presi-gold">●</span>
              {formatCOP(presupuesto).replace("COP", "").trim()}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <span className="text-purple-400">◆</span>
              {seasonPoints.toLocaleString("es-CO")} pts
            </div>
          </div>
        </div>

        {(pendingIncome > 0 ||
          pendingGems > 0 ||
          incomePerTick > 0 ||
          gemsPerTick > 0 ||
          gymBonusPct > 0) && (
          <div className="mt-3 space-y-2">
            {(pendingIncome > 0 ||
              pendingGems > 0 ||
              incomePerTick > 0 ||
              gemsPerTick > 0) && (
              <PassiveIncomeBanner
                pendingAmount={pendingIncome}
                pendingGems={pendingGems}
                pendingTicks={pendingTicks}
                incomePerTick={incomePerTick}
                gemsPerTick={gemsPerTick}
                incomeIntervalHours={incomeIntervalHours}
                nextIncomeTickAt={nextIncomeTickAt}
                weeklyIncome={weeklyIncome}
                weeklyGems={weeklyGems}
              />
            )}
            {gymBonusPct > 0 && (
              <p className="rounded-lg bg-black/40 px-3 py-2 text-center text-[10px] text-white/80 backdrop-blur">
                Bonus gimnasio activo:{" "}
                <span className="font-bold text-presi-cyan">
                  +{gymBonusPct}%
                </span>{" "}
                en puntos de liga
              </p>
            )}
          </div>
        )}

        {/* Puntos del club */}
        <div className="mt-4 rounded-xl border border-presi-gold/30 bg-presi-surface/90 p-4 text-white backdrop-blur">
          <div className="flex items-center gap-3">
            <EscudoRenderer config={escudoConfig} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold uppercase">{clubNombre}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                Temporada
              </p>
            </div>
            <p className="text-4xl font-black text-display text-presi-gold">{seasonPoints.toLocaleString("es-CO")}</p>
          </div>
          {gameweekRound ? (
            <GameweekPointsPanel
              gameweekId={gameweekId}
              gameweekRound={gameweekRound}
              gameweekPoints={gameweekPoints}
            />
          ) : null}
        </div>

        {/* Estado jornada */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-xs text-white backdrop-blur">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                gameweekStatus === "live"
                  ? "bg-presi-cyan text-presi-bg"
                  : "bg-presi-gold text-white"
              }`}
            >
              {gameweekStatus === "live" ? "En vivo" : "Jornada"}
            </span>
            <Clock className="h-3.5 w-3.5 text-presi-gold" />
            <span>
              {gameweekRound
                ? gameweekStatus === "live"
                  ? "Partidos en curso"
                  : isLineupLocked
                    ? "Alineación bloqueada"
                    : "Arma tu alineación"
                : "Sin jornada activa"}
              {!isLineupLocked && deadlineAt && (
                <> · cierra en {deadlineCountdown}</>
              )}
            </span>
          </div>
          {!hasValidDraft && !isLineupLocked && gameweekRound && (
            <Link
              href="/plantilla"
              className="block rounded-lg bg-red-500/20 px-3 py-2 text-center text-[10px] text-red-200 hover:bg-red-500/30"
            >
              Guarda 11 inicial + banca antes del primer partido o no sumarás puntos
            </Link>
          )}
          {contractsExpiringSoon > 0 && (
            <p className="rounded-lg bg-amber-500/20 px-3 py-2 text-center text-[10px] text-amber-200">
              {contractsExpiringSoon} jugador
              {contractsExpiringSoon !== 1 ? "es" : ""} con 1 partido o menos de
              contrato
            </p>
          )}
        </div>

        {/* Center pin */}
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-full bg-presi-cyan/90 p-3 shadow-lg ring-4 ring-white/20">
              <EscudoRenderer config={escudoConfig} size={48} />
            </div>
            <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-medium text-white backdrop-blur">
              Tu estadio
            </span>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link
              href="/instalaciones"
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600"
            >
              <Zap className="h-4 w-4" />
              MEJORAR
            </Link>
            <div className="rounded-full bg-black/50 px-3 py-2 text-xs text-white backdrop-blur">
              Próx. mejora: 4h
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 rounded-xl bg-black/60 p-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wide text-white/60">
                Centro de scouting · Nv.{scoutingState.scoutingNivel}
              </p>
              {scoutingReady ? (
                <>
                  <p className="text-sm font-semibold text-lime-300">
                    {scoutingWildCardReady ? "¡Wild Card!" : "¡Sobre listo!"}
                  </p>
                  <p className="text-xs text-white/70">
                    {scoutingWildCardReady && scoutingState.wildCardType
                      ? getWildCardDefinition(scoutingState.wildCardType).name
                      : scoutingState.player?.nombre}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-white">
                    Próximo fichaje
                  </p>
                  <p className="font-mono text-xs text-presi-gold">
                    {scoutingCountdown}
                  </p>
                </>
              )}
            </div>
            <Link
              href="/instalaciones#scouting"
              className={`rounded-xl px-5 py-4 text-center text-sm font-black shadow-lg transition ${
                scoutingReady
                  ? "bg-lime-400 text-white hover:bg-lime-300"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {scoutingReady ? (
                <>
                  {scoutingWildCardReady ? "WILD" : "ABRIR"}
                  <br />
                  {scoutingWildCardReady ? "CARD" : "SOBRE"}
                </>
              ) : (
                <>
                  VER
                  <br />
                  SCOUTING
                </>
              )}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/plantilla"
              className="rounded-lg bg-white/10 py-2.5 text-center text-xs font-medium text-white backdrop-blur hover:bg-white/20"
            >
              Plantilla
            </Link>
            <Link
              href="/ligas"
              className="rounded-lg bg-white/10 py-2.5 text-center text-xs font-medium text-white backdrop-blur hover:bg-white/20"
            >
              Ligas
            </Link>
            <Link
              href="/ranking"
              className="rounded-lg bg-white/10 py-2.5 text-center text-xs font-medium text-white backdrop-blur hover:bg-white/20"
            >
              Ranking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
