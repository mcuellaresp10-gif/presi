"use client";

import { GemBalance } from "@/components/tienda/GemBalance";
import { LoanMarketSection } from "@/components/tienda/LoanMarketSection";
import { WildCardPackSection } from "@/components/tienda/WildCardPackSection";
import type { TiendaState } from "@/lib/tienda/types";

export function TiendaClient({ initialState }: { initialState: TiendaState }) {
  return (
    <div className="mx-auto min-h-0 max-w-4xl space-y-6 pb-28 pt-4">
      {initialState.loadError && (
        <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {initialState.loadError}
        </p>
      )}
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-presi-cyan/80">
            Mercado
          </p>
          <h1 className="text-display text-2xl text-white">Tienda</h1>
          <p className="mt-1 text-xs text-white/50">
            Préstamos temporales y sobres Wild Card con gemas.
          </p>
        </div>
        <GemBalance gemas={initialState.gemas} />
      </header>

      <LoanMarketSection
        offers={initialState.loanOffers}
        refreshEn={initialState.refreshEn}
        gemas={initialState.gemas}
        activeLoans={initialState.activeLoans}
        maxActiveLoans={initialState.maxActiveLoans}
        defaultLoanJornadas={initialState.defaultLoanJornadas}
      />

      <WildCardPackSection
        packs={initialState.wildCardPacks}
        gemas={initialState.gemas}
        inventoryCount={initialState.wildCardInventoryCount}
      />
    </div>
  );
}
