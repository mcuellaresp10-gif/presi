"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collectPassiveIncome } from "@/lib/actions/facilities";
import { formatRemainingTime } from "@/lib/game";
import { formatCompactMoney } from "@/lib/utils";

export function PassiveIncomeBanner({
  pendingAmount,
  pendingGems,
  pendingTicks,
  incomePerTick,
  gemsPerTick,
  incomeIntervalHours,
  nextIncomeTickAt,
  weeklyIncome,
  weeklyGems,
}: {
  pendingAmount: number;
  pendingGems: number;
  pendingTicks: number;
  incomePerTick: number;
  gemsPerTick: number;
  incomeIntervalHours: number;
  nextIncomeTickAt?: string | null;
  weeklyIncome: number;
  weeklyGems: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const intervalHours = Math.round(incomeIntervalHours);
  const hasPending = pendingAmount > 0 || pendingGems > 0;
  const showCollect = mounted && hasPending;

  const nextTickMs =
    mounted && now !== null && nextIncomeTickAt
      ? Math.max(0, new Date(nextIncomeTickAt).getTime() - now)
      : null;

  async function handleCollect() {
    setLoading(true);
    setError(null);
    const result = await collectPassiveIncome();
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  if (!showCollect) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
        <p>
          Ingreso por cobro:{" "}
          <span className="font-semibold text-presi-cyan">
            {formatCompactMoney(incomePerTick)}
          </span>
          <span className="mx-1 text-white/50">+</span>
          <span className="inline-flex items-center gap-0.5 font-semibold text-violet-300">
            <Gem className="h-3.5 w-3.5" aria-hidden />
            {gemsPerTick} gemas
          </span>
          <span className="text-white/50">
            {" "}
            cada ~{intervalHours}h (Hinchas + Oficina)
          </span>
        </p>
        {nextIncomeTickAt && (
          <p className="mt-1 text-xs text-white/40" suppressHydrationWarning>
            Próximo cobro en{" "}
            {nextTickMs !== null ? formatRemainingTime(nextTickMs) : "—"}
          </p>
        )}
        <p className="mt-1 text-[10px] text-white/35">
          Est. semanal: {formatCompactMoney(weeklyIncome)}
          <span className="mx-1 text-white/40">+</span>
          {weeklyGems} gemas
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-200/80">
            Ingresos pendientes · {pendingTicks} cobro
            {pendingTicks !== 1 ? "s" : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {pendingAmount > 0 && (
              <p className="text-lg font-bold text-presi-cyan">
                {formatCompactMoney(pendingAmount)}
              </p>
            )}
            {pendingGems > 0 && (
              <p className="inline-flex items-center gap-1 text-lg font-bold text-violet-200">
                <Gem className="h-4 w-4 text-violet-300" aria-hidden />
                {pendingGems} gemas
              </p>
            )}
          </div>
          <p className="text-[10px] text-cyan-200/60">
            {formatCompactMoney(incomePerTick)}/cobro
            <span className="mx-1">+</span>
            {gemsPerTick} gemas
            <span className="mx-1">·</span>~{intervalHours}h
          </p>
        </div>
        <Button
          size="sm"
          className="bg-presi-gold font-bold text-white hover:bg-presi-gold/90"
          disabled={loading}
          onClick={handleCollect}
        >
          {loading ? "..." : "Cobrar"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
