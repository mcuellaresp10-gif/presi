"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gem } from "lucide-react";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { useToast } from "@/components/ui/use-toast";
import { collectPassiveIncome } from "@/lib/actions/facilities";
import { formatRemainingTime } from "@/lib/game";
import type { EscudoConfig } from "@/lib/game/types";
import { formatCompactMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SIZE = 112;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StadiumIncomePin({
  escudoConfig,
  nextIncomeTickAt,
  incomeIntervalHours,
  incomePerTick,
  gemsPerTick,
  pendingAmount,
  pendingGems,
  pendingTicks,
}: {
  escudoConfig: EscudoConfig;
  nextIncomeTickAt: string | null;
  incomeIntervalHours: number;
  incomePerTick: number;
  gemsPerTick: number;
  pendingAmount: number;
  pendingGems: number;
  pendingTicks: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [now, setNow] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pendingAmount <= 0 && pendingGems <= 0) {
      setCollected(false);
    }
  }, [pendingAmount, pendingGems]);

  const intervalMs = incomeIntervalHours * 60 * 60 * 1000;
  const hasPending = !collected && (pendingAmount > 0 || pendingGems > 0);

  const { progress, remainingMs } = useMemo(() => {
    if (now === null || !nextIncomeTickAt || intervalMs <= 0) {
      return { progress: 0, remainingMs: null as number | null };
    }
    const remaining = Math.max(
      0,
      new Date(nextIncomeTickAt).getTime() - now
    );
    const elapsedInTick = intervalMs - remaining;
    const p = hasPending
      ? 1
      : Math.min(1, Math.max(0, elapsedInTick / intervalMs));
    return { progress: p, remainingMs: remaining };
  }, [now, nextIncomeTickAt, intervalMs, hasPending]);

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  async function handleCollect() {
    if (!hasPending || loading) return;
    setLoading(true);
    try {
      const result = await collectPassiveIncome();
      if ("error" in result && result.error) {
        toast({
          title: "No se pudo cobrar",
          description: result.error,
        });
        return;
      }

      if (!("success" in result) || !result.success) {
        toast({
          title: "No se pudo cobrar",
          description: "Respuesta inesperada del servidor.",
        });
        return;
      }

      const { amount, gems } = result;
      setCollected(true);
      toast({
        title: "Ingresos cobrados",
        description: [
          amount > 0 ? formatCompactMoney(amount) : null,
          gems > 0 ? `${gems} gemas` : null,
        ]
          .filter(Boolean)
          .join(" + "),
      });
      router.refresh();
    } catch {
      toast({
        title: "No se pudo cobrar",
        description: "Error de conexión. Intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={hasPending ? handleCollect : undefined}
      disabled={loading}
      className={cn(
        "group relative flex flex-col items-center gap-2 outline-none",
        hasPending && "cursor-pointer"
      )}
      aria-label={
        hasPending
          ? "Cobrar ingresos pendientes"
          : "Progreso de recarga de ingresos"
      }
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          aria-hidden
        >
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
            stroke="url(#incomeGradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F5C518" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
        </svg>

        <div
          className={cn(
            "absolute inset-[10px] flex items-center justify-center rounded-full bg-presi-cyan/90 shadow-xl transition-all",
            hasPending ? "nav-glow ring-4 ring-presi-gold/50" : "ring-4 ring-white/10",
            progress > 0.85 && !hasPending && "shadow-presi-cyan/30 shadow-lg"
          )}
        >
          <EscudoRenderer config={escudoConfig} size={52} />
        </div>

        {hasPending ? (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-presi-gold text-[10px] font-bold text-presi-bg">
            !
          </span>
        ) : null}
      </div>

      <div className="text-center">
        <span className="rounded-full bg-black/50 px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur">
          Tu estadio
        </span>

        {hasPending ? (
          <div className="mt-2 space-y-0.5">
            <p className="text-xs font-bold text-presi-gold">
              {loading ? "Cobrando..." : "¡Listo para cobrar!"}
            </p>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-white/80">
              {pendingAmount > 0 ? (
                <span>{formatCompactMoney(pendingAmount)}</span>
              ) : null}
              {pendingAmount > 0 && pendingGems > 0 ? (
                <span className="text-white/40">+</span>
              ) : null}
              {pendingGems > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-presi-cyan">
                  <Gem className="h-3 w-3" />
                  {pendingGems}
                </span>
              ) : null}
            </p>
            {pendingTicks > 1 ? (
              <p className="text-[9px] text-white/40">
                {pendingTicks} cobros acumulados
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-2 space-y-0.5" suppressHydrationWarning>
            <p className="text-[11px] text-white/50">
              Próximo cobro{" "}
              <span className="font-mono font-semibold text-presi-cyan">
                {remainingMs !== null
                  ? formatRemainingTime(remainingMs)
                  : "—"}
              </span>
            </p>
            <p className="text-[9px] text-white/35">
              {formatCompactMoney(incomePerTick)} + {gemsPerTick}{" "}
              <Gem className="inline h-2.5 w-2.5 text-presi-cyan" /> · ~
              {Math.round(incomeIntervalHours)}h
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
