import { describe, expect, it } from "vitest";
import {
  assignTiersFromScores,
  computePerformanceScore,
  costForTier,
  MAX_PLAYER_COST,
  MIN_PLAYER_COST,
  TIER_COST_RANGE,
  type PlayerSeasonStats,
  type ScoredPlayer,
} from "../player-rarity";

function mockStats(
  overrides: Partial<PlayerSeasonStats> & Pick<PlayerSeasonStats, "apiFootballId">
): PlayerSeasonStats {
  return {
    nombre: "Test Player",
    equipo: "Test FC",
    posicion: "DEL",
    photo: null,
    minutes: 0,
    appearances: 0,
    goals: 0,
    assists: 0,
    saves: 0,
    goalsConceded: 0,
    keyPasses: 0,
    tackles: 0,
    duelsWon: 0,
    rating: 0,
    ...overrides,
  };
}

describe("player-rarity", () => {
  it("striker with strong stats scores higher than bench player", () => {
    const star = computePerformanceScore(
      mockStats({
        apiFootballId: 1,
        minutes: 1800,
        appearances: 20,
        goals: 12,
        assists: 5,
      })
    );
    const bench = computePerformanceScore(
      mockStats({ apiFootballId: 2, minutes: 120, appearances: 3 })
    );
    expect(star).toBeGreaterThan(bench);
  });

  it("assignTiersFromScores respects cost bounds", () => {
    const players: ScoredPlayer[] = Array.from({ length: 20 }, (_, i) => {
      const stats = mockStats({
        apiFootballId: i + 1,
        minutes: 200 + i * 100,
        goals: i,
        appearances: 5 + i,
      });
      return { ...stats, performanceScore: computePerformanceScore(stats) };
    });

    const tiers = assignTiersFromScores(players);
    expect(tiers.size).toBe(20);

    for (const tier of tiers.values()) {
      expect(tier.costo_base).toBeGreaterThanOrEqual(MIN_PLAYER_COST);
      expect(tier.costo_base).toBeLessThanOrEqual(MAX_PLAYER_COST);
      expect(tier.costo_base).toBeGreaterThanOrEqual(
        TIER_COST_RANGE[tier.rareza][0]
      );
      expect(tier.costo_base).toBeLessThanOrEqual(
        TIER_COST_RANGE[tier.rareza][1]
      );
    }
  });

  it("low minutes caps premium tiers to plata", () => {
    const players: ScoredPlayer[] = [
      {
        ...mockStats({
          apiFootballId: 99,
          minutes: 45,
          goals: 20,
          appearances: 2,
        }),
        performanceScore: 95,
      },
    ];
    const tiers = assignTiersFromScores(players);
    expect(tiers.get(99)?.rareza).toBe("plata");
  });

  it("costForTier stays within tier range", () => {
    expect(costForTier("leyenda", 80, 70, 90)).toBeLessThanOrEqual(5_000_000);
    expect(costForTier("bronce", 10, 10, 20)).toBeGreaterThanOrEqual(500_000);
  });
});
