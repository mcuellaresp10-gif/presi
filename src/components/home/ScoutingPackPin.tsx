"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { formatRemainingTime, getScoutingDurationMs } from "@/lib/game";
import type { ScoutingUIState } from "@/components/scouting/ScoutingPackCard";
import { cn } from "@/lib/utils";

const SIZE = 36;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoutingPackPin({ state }: { state: ScoutingUIState }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isWildCardReady = state.estado === "listo" && !!state.wildCardType;
  const isPlayerReady = state.estado === "listo" && !!state.player;
  const isReady = isWildCardReady || isPlayerReady;

  const durationMs = getScoutingDurationMs(state.scoutingNivel);

  const { progress, remainingMs } = useMemo(() => {
    if (now === null || !state.generaEn || durationMs <= 0) {
      return { progress: 0, remainingMs: null as number | null };
    }
    const remaining = Math.max(
      0,
      new Date(state.generaEn).getTime() - now
    );
    const elapsed = durationMs - remaining;
    const p = isReady
      ? 1
      : Math.min(1, Math.max(0, elapsed / durationMs));
    return { progress: p, remainingMs: remaining };
  }, [now, state.generaEn, durationMs, isReady]);

  useEffect(() => {
    if (isReady) return;
    if (remainingMs !== null && remainingMs <= 0 && state.estado === "timer") {
      router.refresh();
    }
  }, [remainingMs, isReady, router, state.estado]);

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const subtitle = isReady
    ? isWildCardReady
      ? "¡Sorpresa especial! Toca para abrir"
      : "¡Listo! Toca para descubrirlo"
    : remainingMs !== null
      ? `En camino · ${formatRemainingTime(remainingMs)}`
      : "En camino...";

  const inner = (
    <div
      data-testid="player-discovery-bar"
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 shadow-xl backdrop-blur-md transition-all",
        isReady
          ? "border-presi-gold/50 bg-presi-gold/15 hover:bg-presi-gold/20"
          : "border-presi-gold/25 bg-presi-elevated ring-1 ring-white/10"
      )}
    >
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="url(#scoutingPinGradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="scoutingPinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F5F147" />
              <stop offset="100%" stopColor="#F57847" />
            </linearGradient>
          </defs>
        </svg>

        <div
          className={cn(
            "absolute inset-[5px] flex items-center justify-center rounded-lg bg-gradient-to-br from-presi-gold/80 to-presi-coral/80",
            isReady && "ring-1 ring-presi-gold/60"
          )}
        >
          <Sparkles className="h-3.5 w-3.5 text-white/90" strokeWidth={2.5} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold leading-tight text-white">
          Descubre tu próximo jugador
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-[10px] leading-tight",
            isReady ? "font-medium text-presi-gold" : "text-white/55"
          )}
          suppressHydrationWarning
        >
          {subtitle}
        </p>
      </div>

      {isReady ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-presi-gold/80" />
      ) : null}

      {!isReady ? (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 bg-white/5"
          aria-hidden
        >
          <div
            className="h-full bg-presi-gold transition-all duration-1000 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );

  if (isReady) {
    return (
      <Link
        href="/instalaciones#scouting"
        className="block outline-none active:scale-[0.98]"
        aria-label="Descubre tu próximo jugador — listo para abrir"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div aria-label="Descubre tu próximo jugador — en camino">{inner}</div>
  );
}
