import { describe, expect, it } from "vitest";
import {
  canActivateWildCard,
  canClaimWildCard,
  generateScoutingReward,
  getWildCardChance,
  MAX_WILD_CARD_INVENTORY,
  rollScoutingRewardKind,
} from "../wild-cards";
import { countPositions } from "../roster";
import { createSeededRng, type RNG } from "../rng";
import type { Player } from "../types";

function buildPool(): Player[] {
  const rarities: Player["rareza"][] = ["bronce", "plata", "oro", "leyenda"];
  const positions: Player["posicion"][] = ["GK", "DEF", "MED", "DEL"];
  const players: Player[] = [];

  for (const pos of positions) {
    for (let i = 0; i < 8; i++) {
      players.push({
        id: `${pos}-${i}`,
        api_football_id: null,
        nombre: `${pos} ${i}`,
        equipo_real: "Test FC",
        posicion: pos,
        rareza: rarities[i % rarities.length],
        costo_base: 3_000_000,
      });
    }
  }
  return players;
}

describe("wild-cards", () => {
  it("wild card chance scales with hinchas level", () => {
    expect(getWildCardChance(1)).toBeCloseTo(0.1);
    expect(getWildCardChance(5)).toBeCloseTo(0.14);
  });

  it("inventory cap blocks claim at 6 and one per type", () => {
    expect(MAX_WILD_CARD_INVENTORY).toBe(6);
    expect(
      canClaimWildCard(["free_sign", "bench_boost"], "contract_shield").ok
    ).toBe(true);
    expect(
      canClaimWildCard(
        [
          "free_sign",
          "bench_boost",
          "contract_shield",
          "free_renewal",
          "golden_scout",
          "double_gameweek",
        ],
        "free_sign"
      ).ok
    ).toBe(false);
    expect(canClaimWildCard(["free_sign"], "free_sign").ok).toBe(false);
    expect(canClaimWildCard([], "free_sign").ok).toBe(true);
  });

  it("rollScoutingRewardKind respects probability", () => {
    let wild = 0;
    const rng = createSeededRng(99);
    for (let i = 0; i < 1000; i++) {
      if (rollScoutingRewardKind(5, rng) === "wild_card") wild += 1;
    }
    expect(wild).toBeGreaterThan(50);
    expect(wild).toBeLessThan(250);
  });

  it("generateScoutingReward returns wild card even with full roster", () => {
    const pool = buildPool();
    const fullRoster = pool.slice(0, 24);
    expect(countPositions(fullRoster).GK + countPositions(fullRoster).DEF +
      countPositions(fullRoster).MED + countPositions(fullRoster).DEL).toBe(24);

    let calls = 0;
    const rng: RNG = {
      next() {
        calls += 1;
        return calls === 1 ? 0.01 : 0.5;
      },
    };

    const reward = generateScoutingReward(
      pool,
      countPositions(fullRoster),
      5,
      rng
    );
    expect(reward?.kind).toBe("wild_card");
    if (reward?.kind === "wild_card") {
      expect(reward.cardType).toBeTruthy();
    }
  });

  it("generateScoutingReward returns null when roster full and roll is player", () => {
    const pool = buildPool();
    const fullRoster = pool.slice(0, 24);
    const rng: RNG = { next: () => 0.99 };

    const reward = generateScoutingReward(
      pool,
      countPositions(fullRoster),
      5,
      rng
    );
    expect(reward).toBeNull();
  });

  it("golden scout min rarity forces oro+ player", () => {
    const pool = buildPool();
    const reward = generateScoutingReward(
      pool,
      countPositions([]),
      1,
      createSeededRng(7),
      { minRarity: "oro" }
    );
    expect(reward?.kind).toBe("player");
    if (reward?.kind === "player") {
      expect(["oro", "leyenda"]).toContain(reward.player.rareza);
    }
  });

  it("canActivateWildCard blocks second gameweek card", () => {
    const result = canActivateWildCard("bench_boost", "live", [
      "double_gameweek",
    ]);
    expect(result.ok).toBe(false);
  });

  it("canActivateWildCard allows instant cards without gameweek", () => {
    const result = canActivateWildCard("golden_scout", null, []);
    expect(result.ok).toBe(true);
  });
});
