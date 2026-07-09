"use client";

import { useEffect, useMemo, useState } from "react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatRemainingTime } from "@/lib/game/facilities";
import {
  formatUpgradeEndTime,
  getFacilityUpgradeProgress,
  getUpgradeStatusCopy,
} from "@/lib/game/facility-upgrade-progress";
import {
  getFacilityIcon,
  getFacilityLabel,
} from "@/lib/game/facility-meta";
import type { FacilityType } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const CARD_RING = 80;
const COMPACT_RING = 36;

export function FacilityUpgradeProgress({
  tipo,
  nivel,
  mejoraIniciaEn,
  mejoraTerminaEn,
  variant = "card",
  now: nowProp,
  buildHours,
  shortLabel,
}: {
  tipo: FacilityType;
  nivel: number;
  mejoraIniciaEn: string | null;
  mejoraTerminaEn: string | null;
  variant?: "card" | "compact" | "dock";
  now?: number;
  buildHours?: number;
  shortLabel?: string;
}) {
  const [internalNow, setInternalNow] = useState(() => Date.now());

  useEffect(() => {
    if (nowProp !== undefined) return;
    const interval = setInterval(() => setInternalNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [nowProp]);

  const now = nowProp ?? internalNow;

  const progressState = useMemo(
    () =>
      getFacilityUpgradeProgress(
        {
          nivel,
          mejora_inicia_en: mejoraIniciaEn,
          mejora_termina_en: mejoraTerminaEn,
        },
        now
      ),
    [nivel, mejoraIniciaEn, mejoraTerminaEn, now]
  );

  if (!progressState) return null;

  const { progress, remainingMs, isCompletePending, targetLevel } =
    progressState;
  const copy = getUpgradeStatusCopy(progressState);
  const percent = Math.round(progress * 100);
  const label = shortLabel ?? getFacilityLabel(tipo);
  const icon = getFacilityIcon(tipo);

  const ariaLabel = isCompletePending
    ? `Obra de ${label} terminada, finalizando nivel ${targetLevel}`
    : `Obra de ${label} al ${percent} por ciento, faltan ${formatRemainingTime(remainingMs)}`;

  if (variant === "compact") {
    return (
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-label={ariaLabel}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <ProgressRing
          size={COMPACT_RING}
          stroke={2.5}
          progress={progress}
          className="absolute -top-1 left-1/2 -translate-x-1/2"
          badge={
            isCompletePending ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-presi-gold text-[7px] font-bold text-presi-bg">
                !
              </span>
            ) : null
          }
        >
          <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-black/50 text-sm">
            {icon}
          </div>
        </ProgressRing>
      </div>
    );
  }

  if (variant === "dock") {
    return (
      <div
        className="min-w-0 flex-1"
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="truncate font-medium text-white/80">
            {icon} {label}
          </span>
          <span
            className="shrink-0 font-mono text-presi-cyan"
            suppressHydrationWarning
          >
            {isCompletePending ? "¡Listo!" : formatRemainingTime(remainingMs)}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-presi-gold to-presi-cyan transition-all duration-1000 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  const ringSize = CARD_RING;
  const innerInset = Math.round(ringSize * 0.125);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-center",
        isCompletePending
          ? "border-presi-gold/40 bg-presi-gold/10"
          : "border-presi-cyan/20 bg-presi-cyan/5"
      )}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex flex-col items-center gap-3">
        <ProgressRing
          size={ringSize}
          stroke={4}
          progress={progress}
          badge={
            isCompletePending ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-presi-gold text-[10px] font-bold text-presi-bg">
                !
              </span>
            ) : null
          }
        >
          <div
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-presi-surface text-2xl ring-2",
              isCompletePending
                ? "nav-glow ring-presi-gold/50"
                : progress >= 0.9
                  ? "ring-presi-cyan/40 shadow-lg shadow-presi-cyan/20"
                  : "ring-white/10"
            )}
            style={{
              inset: innerInset,
            }}
          >
            {icon}
          </div>
        </ProgressRing>

        <div>
          <p className="text-xs font-semibold text-white/90">
            {label} · Nv.{nivel} → {targetLevel}
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-bold",
              isCompletePending ? "text-presi-gold" : "text-white/80"
            )}
          >
            {copy.title}
          </p>
        </div>

        {!isCompletePending ? (
          <p
            className="font-mono text-2xl font-bold text-presi-cyan"
            suppressHydrationWarning
          >
            {formatRemainingTime(remainingMs)}
          </p>
        ) : null}

        <p className="text-[11px] text-white/50">{copy.subtitle}</p>

        {mejoraTerminaEn && !isCompletePending ? (
          <p className="text-[10px] text-white/40">
            Termina ~{formatUpgradeEndTime(mejoraTerminaEn)}
            {buildHours ? ` · ~${Math.round(buildHours)}h total` : null}
          </p>
        ) : null}

        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-presi-gold to-presi-cyan transition-all duration-1000 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
