"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoanPlayerCard } from "@/components/tienda/LoanPlayerCard";
import { formatRemainingTime } from "@/lib/game";
import type { TiendaLoanOffer } from "@/lib/tienda/types";

export function LoanMarketSection({
  offers,
  refreshEn,
  gemas,
  activeLoans,
  maxActiveLoans,
  defaultLoanJornadas,
}: {
  offers: TiendaLoanOffer[];
  refreshEn: string;
  gemas: number;
  activeLoans: number;
  maxActiveLoans: number;
  defaultLoanJornadas: number;
}) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (now === null) return;
    const remaining = Math.max(0, new Date(refreshEn).getTime() - now);
    if (remaining <= 0) {
      const poll = setInterval(() => router.refresh(), 30000);
      return () => clearInterval(poll);
    }
  }, [now, refreshEn, router]);

  const remainingMs =
    now === null
      ? 0
      : Math.max(0, new Date(refreshEn).getTime() - now);
  const atLoanCap = activeLoans >= maxActiveLoans;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Mercado de préstamos
          </h2>
          <p className="text-[11px] text-white/45">
            {defaultLoanJornadas} jornadas por jugador · máx. {maxActiveLoans}{" "}
            activos ({activeLoans}/{maxActiveLoans})
          </p>
        </div>
        <p className="rounded bg-black/30 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-presi-cyan">
          Refresh: {now === null ? "—" : formatRemainingTime(remainingMs)}
        </p>
      </div>

      {atLoanCap && (
        <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Tienes el máximo de préstamos activos. Espera a que expiren para firmar
          más.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {offers.map((offer) => (
          <LoanPlayerCard
            key={offer.slotIndex}
            offer={offer}
            gemas={gemas}
            disabled={atLoanCap}
          />
        ))}
      </div>

      {offers.length === 0 && (
        <p className="rounded-xl bg-white/5 p-6 text-center text-sm text-white/50">
          No hay ofertas disponibles. Vuelve cuando se renueve el mercado.
        </p>
      )}
    </section>
  );
}
