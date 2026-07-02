import { describe, expect, it } from "vitest";
import { computeEffectiveLineup } from "../effective-lineup";
import type { Player } from "../types";
import { testStat } from "./test-stat";

function player(id: string, pos: Player["posicion"]): Player {
  return {
    id,
    api_football_id: null,
    nombre: id,
    equipo_real: "Test",
    posicion: pos,
    rareza: "bronce",
    costo_base: 1_000_000,
  };
}

describe("effective-lineup bench boost", () => {
  it("includes bench players with minutes when benchBoost is active", () => {
    const starters = [
      "gk",
      "d1",
      "d2",
      "d3",
      "d4",
      "m1",
      "m2",
      "m3",
      "m4",
      "f1",
      "f2",
    ];
    const bench = ["gk2", "d5", "m5", "f3", "f4"];
    const players = new Map<string, Player>([
      ["gk", player("gk", "GK")],
      ["d1", player("d1", "DEF")],
      ["d2", player("d2", "DEF")],
      ["d3", player("d3", "DEF")],
      ["d4", player("d4", "DEF")],
      ["m1", player("m1", "MED")],
      ["m2", player("m2", "MED")],
      ["m3", player("m3", "MED")],
      ["m4", player("m4", "MED")],
      ["f1", player("f1", "DEL")],
      ["f2", player("f2", "DEL")],
      ["gk2", player("gk2", "GK")],
      ["d5", player("d5", "DEF")],
      ["m5", player("m5", "MED")],
      ["f3", player("f3", "DEL")],
      ["f4", player("f4", "DEL")],
    ]);

    const stats = new Map([
      [
        "gk",
        testStat("gk", "GK", {
          minutes: 90,
          started: true,
          teamResult: "win",
        }),
      ],
      [
        "d1",
        testStat("d1", "DEF", { minutes: 90, started: true, teamResult: "win" }),
      ],
      [
        "d2",
        testStat("d2", "DEF", { minutes: 90, started: true, teamResult: "win" }),
      ],
      [
        "d3",
        testStat("d3", "DEF", { minutes: 90, started: true, teamResult: "win" }),
      ],
      [
        "d4",
        testStat("d4", "DEF", { minutes: 90, started: true, teamResult: "win" }),
      ],
      [
        "m1",
        testStat("m1", "MED", { minutes: 90, goals: 1, started: true }),
      ],
      [
        "m2",
        testStat("m2", "MED", { minutes: 90, assists: 1, started: true }),
      ],
      [
        "m3",
        testStat("m3", "MED", { minutes: 90, started: true }),
      ],
      [
        "m4",
        testStat("m4", "MED", { minutes: 90, started: true }),
      ],
      [
        "f1",
        testStat("f1", "DEL", { minutes: 90, goals: 2, started: true }),
      ],
      [
        "f2",
        testStat("f2", "DEL", { minutes: 90, started: true }),
      ],
      [
        "m5",
        testStat("m5", "MED", { minutes: 45, goals: 1, started: false }),
      ],
    ]);

    const withoutBoost = computeEffectiveLineup(
      { starterIds: starters, benchIds: bench, isValid: true },
      players,
      stats
    );
    const withBoost = computeEffectiveLineup(
      { starterIds: starters, benchIds: bench, isValid: true },
      players,
      stats,
      { benchBoost: true }
    );

    expect(withoutBoost.scoringPlayers.some((p) => p.playerId === "m5")).toBe(
      false
    );
    expect(withBoost.scoringPlayers.some((p) => p.playerId === "m5")).toBe(true);
    expect(withBoost.scoringPlayers.length).toBeGreaterThan(
      withoutBoost.scoringPlayers.length
    );
  });
});
