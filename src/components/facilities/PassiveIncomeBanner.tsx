"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { collectPassiveIncome } from "@/lib/actions/facilities";
import { formatRemainingTime } from "@/lib/game";
import { formatCompactMoney } from "@/lib/utils";

export function PassiveIncomeBanner({
  pendingAmount,
  pendingTicks,
  incomePerTick,
  incomeIntervalHours,
  nextIncomeTickAt,
  weeklyIncome,
}: {
  pendingAmount: number;
  pendingTicks: number;
  incomePerTick: number;
  incomeIntervalHours: number;
  nextIncomeTickAt?: string | null;
  weeklyIncome: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const nextTickMs = nextIncomeTickAt
    ? Math.max(0, new Date(nextIncomeTickAt).getTime() - now)
    : null;

  if (pendingAmount <= 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
        <p>
          Ingreso por cobro:{" "}
          <span className="font-semibold text-cyan-300">
            {formatCompactMoney(incomePerTick)}
          </span>{" "}
          cada ~{Math.round(incomeIntervalHours)}h (Hinchas + Oficina)
        </p>
        {nextTickMs !== null && (
          <p className="mt-1 text-xs text-white/40">
            Próximo cobro en {formatRemainingTime(nextTickMs)}
          </p>
        )}
        <p className="mt-1 text-[10px] text-white/35">
          Est. semanal: {formatCompactMoney(weeklyIncome)}
        </p>
      </div>
    );
  }

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

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-200/80">
            Ingresos pendientes · {pendingTicks} cobro
            {pendingTicks !== 1 ? "s" : ""}
          </p>
          <p className="text-lg font-bold text-cyan-300">
            {formatCompactMoney(pendingAmount)}
          </p>
          <p className="text-[10px] text-cyan-200/60">
            {formatCompactMoney(incomePerTick)}/cobro · ~{Math.round(incomeIntervalHours)}h
          </p>
        </div>
        <Button
          size="sm"
          className="bg-cyan-500 font-bold text-andes-deep hover:bg-cyan-400"
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
