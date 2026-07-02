import type { WildCardPackTierId } from "@/lib/game/wild-card-packs";
import type { LoanOffer } from "@/lib/game/loan-market";
import type { Player } from "@/lib/game/types";

export type TiendaLoanOffer = LoanOffer & {
  player: Player | null;
};

export type TiendaWildCardPack = {
  id: WildCardPackTierId;
  name: string;
  description: string;
  costGems: number;
  color: string;
  canBuy: boolean;
  blockedReason: string | null;
};

export type TiendaState = {
  gemas: number;
  refreshEn: string;
  refreshMs: number;
  loanOffers: TiendaLoanOffer[];
  activeLoans: number;
  maxActiveLoans: number;
  defaultLoanJornadas: number;
  wildCardPacks: TiendaWildCardPack[];
  wildCardInventoryCount: number;
  loadError?: string | null;
};
