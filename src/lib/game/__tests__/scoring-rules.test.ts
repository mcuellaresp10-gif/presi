import { describe, expect, it } from "vitest";
import {
  calculatePlayerPointsWithBreakdown,
  type ScoringStatInput,
} from "../scoring-rules";

function stat(
  overrides: Partial<ScoringStatInput> & { posicion: ScoringStatInput["posicion"] }
): ScoringStatInput {
  return {
    minutes: 90,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    goalsConceded: 0,
    started: true,
    teamResult: null,
    saves: 0,
    passesAccurate: 0,
    tacklesWon: 0,
    dribblesSuccess: 0,
    keyPasses: 0,
    bigChancesCreated: 0,
    foulsDrawn: 0,
    duelsWon: 0,
    duelsLost: 0,
    foulsCommitted: 0,
    ...overrides,
  };
}

describe("scoring-rules", () => {
  it("Verbruggen-style GK: draw + saves + started", () => {
    const result = calculatePlayerPointsWithBreakdown(
      stat({
        posicion: "GK",
        minutes: 120,
        teamResult: "draw",
        saves: 5,
      })
    );
    expect(result.total).toBe(9);
  });

  it("Courtois-style GK: win + saves + high claims proxy skipped + GC extra", () => {
    const result = calculatePlayerPointsWithBreakdown(
      stat({
        posicion: "GK",
        minutes: 120,
        teamResult: "win",
        saves: 3,
        goalsConceded: 2,
      })
    );
    expect(result.total).toBe(9);
  });

  it("Marquinhos-style DEF: 90+ passes + win + micro stats", () => {
    const result = calculatePlayerPointsWithBreakdown(
      stat({
        posicion: "DEF",
        minutes: 90,
        teamResult: "win",
        passesAccurate: 95,
        tacklesWon: 1,
        keyPasses: 1,
        foulsDrawn: 1,
      })
    );
    expect(result.total).toBe(17);
  });

  it("Hincapié-style DEF: red card and defensive negatives", () => {
    const result = calculatePlayerPointsWithBreakdown(
      stat({
        posicion: "DEF",
        minutes: 90,
        tacklesWon: 2,
        keyPasses: 1,
        foulsDrawn: 1,
        duelsLost: 2,
        goalsConceded: 2,
        foulsCommitted: 2,
        redCards: 1,
      })
    );
    expect(result.total).toBe(-6);
  });

  it("DEF goal worth more than DEL goal", () => {
    const defGoal = calculatePlayerPointsWithBreakdown(
      stat({ posicion: "DEF", minutes: 90, goals: 1, started: false })
    ).total;
    const delGoal = calculatePlayerPointsWithBreakdown(
      stat({ posicion: "DEL", minutes: 90, goals: 1, started: false })
    ).total;
    expect(defGoal).toBe(12);
    expect(delGoal).toBe(8);
    expect(defGoal).toBeGreaterThan(delGoal);
  });

  it("DEL tackle worth more than DEF tackle", () => {
    const defTackle = calculatePlayerPointsWithBreakdown(
      stat({ posicion: "DEF", minutes: 90, tacklesWon: 2, started: false })
    ).total;
    const delTackle = calculatePlayerPointsWithBreakdown(
      stat({ posicion: "DEL", minutes: 90, tacklesWon: 2, started: false })
    ).total;
    expect(defTackle).toBe(2);
    expect(delTackle).toBe(4);
    expect(delTackle).toBeGreaterThan(defTackle);
  });

  it("medical facility reduces negative lines only", () => {
    const base = calculatePlayerPointsWithBreakdown(
      stat({
        posicion: "DEL",
        minutes: 90,
        yellowCards: 1,
        redCards: 1,
        foulsCommitted: 1,
      })
    );
    const reduced = calculatePlayerPointsWithBreakdown(
      stat({
        posicion: "DEL",
        minutes: 90,
        yellowCards: 1,
        redCards: 1,
        foulsCommitted: 1,
      }),
      { penaltyReduction: 0.5 }
    );
    expect(base.total).toBeLessThan(0);
    expect(reduced.total).toBeGreaterThan(base.total);
  });

  it("returns zero with no minutes", () => {
    const result = calculatePlayerPointsWithBreakdown(
      stat({ posicion: "DEL", minutes: 0, goals: 2 })
    );
    expect(result.total).toBe(0);
    expect(result.lines).toHaveLength(0);
  });
});
