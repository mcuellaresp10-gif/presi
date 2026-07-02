import { describe, expect, it } from "vitest";
import { emptyMatchStatLine, calculatePlayerPoints } from "../scoring";

describe("scoring", () => {
  it("awards goal and assist points for forward", () => {
    const stat = {
      ...emptyMatchStatLine("a", "DEL"),
      minutes: 90,
      goals: 1,
      assists: 1,
      started: true,
    };
    // 8 goal + 8 assist + 3 started = 19
    expect(calculatePlayerPoints(stat)).toBe(19);
  });

  it("returns zero with no minutes", () => {
    const stat = {
      ...emptyMatchStatLine("a", "DEL"),
      goals: 2,
      assists: 2,
    };
    expect(calculatePlayerPoints(stat)).toBe(0);
  });

  it("reduces card penalties with medical facility bonus", () => {
    const stat = {
      ...emptyMatchStatLine("a", "DEL"),
      minutes: 90,
      yellowCards: 1,
      redCards: 1,
      started: true,
    };
    // -2 yellow -8 red + 3 started = -7
    expect(calculatePlayerPoints(stat)).toBe(-7);
    // 50% reduction on negatives: yellow -1, red -4, started +3 => -2
    expect(calculatePlayerPoints(stat, { penaltyReduction: 0.5 })).toBe(-2);
  });
});
