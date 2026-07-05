"use client";

import { PageHeader } from "@/components/ui/page-header";
import { LoanMarketSection } from "@/components/tienda/LoanMarketSection";
import { WildCardPackSection } from "@/components/tienda/WildCardPackSection";
import type { TiendaState } from "@/lib/tienda/types";

export function TiendaClient({ initialState }: { initialState: TiendaState }) {
  return (
    <div className="space-y-6">
      {initialState.loadError ? (
        <p className="rounded-lg border border-presi-warning/30 bg-presi-warning/10 px-3 py-2 text-xs text-presi-warning">
          {initialState.loadError}
        </p>
      ) : null}

      <PageHeader
        title="Tienda"
        subtitle="Préstamos temporales y sobres Wild Card con gemas"
      />

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
