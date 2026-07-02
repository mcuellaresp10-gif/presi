import { describe, expect, it } from "vitest";
import {
  rollWildCardFromPack,
  WILD_CARD_PACK_TIERS,
} from "../wild-card-packs";
import { canClaimWildCard, MAX_WILD_CARD_INVENTORY } from "../wild-cards";
import { createSeededRng } from "../rng";

describe("wild-card-packs", () => {
  it("exposes three purchasable tiers with gem costs", () => {
    expect(WILD_CARD_PACK_TIERS).toHaveLength(3);
    expect(WILD_CARD_PACK_TIERS.map((t) => t.costGems)).toEqual([40, 120, 250]);
  });

  it("legend tier only rolls premium cards", () => {
    const rng = createSeededRng(42);
    for (let i = 0; i < 30; i++) {
      const card = rollWildCardFromPack("leyenda", rng);
      expect(["golden_scout", "double_gameweek", "free_sign"]).toContain(card);
    }
  });

  it("bronce tier can roll any catalog type", () => {
    const rng = createSeededRng(99);
    const rolled = new Set<string>();
    for (let i = 0; i < 200; i++) {
      rolled.add(rollWildCardFromPack("bronce", rng));
    }
    expect(rolled.size).toBeGreaterThan(3);
  });

  it("inventory validation blocks purchase at cap", () => {
    const fullInventory = [
      "free_sign",
      "bench_boost",
      "contract_shield",
      "free_renewal",
      "golden_scout",
      "double_gameweek",
    ] as const;
    expect(fullInventory).toHaveLength(MAX_WILD_CARD_INVENTORY);
    expect(canClaimWildCard([...fullInventory], "free_sign").ok).toBe(false);
    expect(canClaimWildCard(["free_sign"], "free_sign").ok).toBe(false);
    expect(canClaimWildCard([], "free_sign").ok).toBe(true);
  });
});
