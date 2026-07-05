import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOAN_JORNADAS,
  generateLoanOffers,
  getLoanGemCost,
  getNextLoanRefresh,
  isLoanMarketReady,
  loanMarketSeed,
  LOAN_MARKET_REFRESH_MS,
  LOAN_OFFER_COUNT,
  parseLoanOffers,
} from "../loan-market";
import { createSeededRng } from "../rng";
import type { Player } from "../types";

function buildPool(count = 20): Player[] {
  const rarities: Player["rareza"][] = ["bronce", "plata", "oro", "leyenda"];
  const positions: Player["posicion"][] = ["GK", "DEF", "MED", "DEL"];
  return Array.from({ length: count }, (_, i) => ({
    id: `p-${i}`,
    api_football_id: null,
    nombre: `Player ${i}`,
    equipo_real: "Test FC",
    posicion: positions[i % positions.length],
    rareza: rarities[i % rarities.length],
    costo_base: 3_000_000,
  }));
}

describe("loan-market", () => {
  it("generates stable offers within the same 12h window", () => {
    const clubId = "club-abc";
    const pool = buildPool();
    const now = LOAN_MARKET_REFRESH_MS * 5 + 1_000;

    const a = generateLoanOffers(clubId, pool, now);
    const b = generateLoanOffers(clubId, pool, now + 60_000);

    expect(a).toHaveLength(LOAN_OFFER_COUNT);
    expect(b).toHaveLength(LOAN_OFFER_COUNT);
    expect(a.map((o) => o.playerId)).toEqual(b.map((o) => o.playerId));
    expect(a.map((o) => o.costoGemas)).toEqual(b.map((o) => o.costoGemas));
  });

  it("changes offers after refresh window", () => {
    const clubId = "club-xyz";
    const pool = buildPool();
    const windowA = LOAN_MARKET_REFRESH_MS * 2;
    const windowB = LOAN_MARKET_REFRESH_MS * 3;

    const a = generateLoanOffers(clubId, pool, windowA);
    const b = generateLoanOffers(clubId, pool, windowB);

    expect(a.map((o) => o.playerId)).not.toEqual(b.map((o) => o.playerId));
  });

  it("prices gem costs by rarity", () => {
    const rng = createSeededRng(loanMarketSeed("club", 0));
    const bronce = getLoanGemCost(
      { rareza: "bronce" } as Player,
      rng
    );
    const leyenda = getLoanGemCost(
      { rareza: "leyenda" } as Player,
      createSeededRng(loanMarketSeed("club", 1))
    );

    expect(bronce).toBeGreaterThanOrEqual(5);
    expect(bronce).toBeLessThanOrEqual(10);
    expect(leyenda).toBeGreaterThanOrEqual(35);
    expect(leyenda).toBeLessThanOrEqual(45);
  });

  it("defaults loan duration to 3 jornadas", () => {
    const offers = generateLoanOffers("club", buildPool());
    expect(offers.every((o) => o.jornadasPrestamo === DEFAULT_LOAN_JORNADAS)).toBe(
      true
    );
  });

  it("parses stored offers json", () => {
    const parsed = parseLoanOffers([
      { playerId: "p-1", costoGemas: 40, claimed: false },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.playerId).toBe("p-1");
    expect(parsed[0]?.costoGemas).toBe(40);
  });

  it("refresh helpers respect 12h cadence", () => {
    const refresh = getNextLoanRefresh(new Date(LOAN_MARKET_REFRESH_MS * 2 + 1000));
    expect(refresh.getTime() % LOAN_MARKET_REFRESH_MS).toBe(0);
    expect(isLoanMarketReady(new Date(Date.now() - 1000).toISOString())).toBe(
      true
    );
  });
});
