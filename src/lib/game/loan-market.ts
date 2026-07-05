import type { RNG } from "./rng";
import { createSeededRng } from "./rng";
import type { Player, Rarity } from "./types";

export const LOAN_MARKET_REFRESH_MS = 12 * 60 * 60 * 1000;
export const LOAN_OFFER_COUNT = 6;
export const DEFAULT_LOAN_JORNADAS = 3;
export const MAX_ACTIVE_LOANS = 3;

export interface LoanOffer {
  slotIndex: number;
  playerId: string;
  costoGemas: number;
  jornadasPrestamo: number;
  claimed: boolean;
}

const GEM_COST_BY_RARITY: Record<Rarity, [number, number]> = {
  bronce: [5, 10],
  plata: [12, 18],
  oro: [22, 32],
  leyenda: [35, 45],
};

export function loanMarketWindowStart(now = Date.now()): number {
  return Math.floor(now / LOAN_MARKET_REFRESH_MS) * LOAN_MARKET_REFRESH_MS;
}

export function loanMarketSeed(clubId: string, now = Date.now()): number {
  const window = loanMarketWindowStart(now);
  let hash = window >>> 0;
  for (let i = 0; i < clubId.length; i++) {
    hash = (Math.imul(hash, 31) + clubId.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

export function getLoanGemCost(player: Player, rng: RNG): number {
  const [min, max] = GEM_COST_BY_RARITY[player.rareza];
  if (min === max) return min;
  const span = max - min + 1;
  return min + Math.floor(rng.next() * span);
}

export function getNextLoanRefresh(from: Date = new Date()): Date {
  const windowStart = loanMarketWindowStart(from.getTime());
  return new Date(windowStart + LOAN_MARKET_REFRESH_MS);
}

export function isLoanMarketReady(refreshEn: string | Date): boolean {
  return new Date(refreshEn).getTime() <= Date.now();
}

export function generateLoanOffers(
  clubId: string,
  pool: Player[],
  now = Date.now()
): LoanOffer[] {
  if (pool.length === 0) return [];

  const rng = createSeededRng(loanMarketSeed(clubId, now));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, LOAN_OFFER_COUNT);
  return selected.map((player, slotIndex) => ({
    slotIndex,
    playerId: player.id,
    costoGemas: getLoanGemCost(player, rng),
    jornadasPrestamo: DEFAULT_LOAN_JORNADAS,
    claimed: false,
  }));
}

export function parseLoanOffers(raw: unknown): LoanOffer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const playerId = row.playerId;
      if (typeof playerId !== "string") return null;
      return {
        slotIndex:
          typeof row.slotIndex === "number" ? row.slotIndex : index,
        playerId,
        costoGemas: Number(row.costoGemas) || 0,
        jornadasPrestamo:
          Number(row.jornadasPrestamo) || DEFAULT_LOAN_JORNADAS,
        claimed: Boolean(row.claimed),
      };
    })
    .filter((offer): offer is LoanOffer => offer !== null);
}
