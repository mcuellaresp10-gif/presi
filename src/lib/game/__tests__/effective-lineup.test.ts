import { describe, expect, it } from "vitest";
import {
  computeEffectiveLineup,
  type LineupSelection,
} from "../effective-lineup";
import type { Player } from "../types";
import { testStat } from "./test-stat";

function player(
  id: string,
  posicion: Player["posicion"]
): Player {
  return {
    id,
    api_football_id: null,
    nombre: id,
    equipo_real: "Test",
    posicion,
    rareza: "bronce",
    costo_base: 1_000_000,
  };
}

describe("effective-lineup", () => {
  const players = [
    player("gk1", "GK"),
    player("d1", "DEF"),
    player("d2", "DEF"),
    player("d3", "DEF"),
    player("d4", "DEF"),
    player("m1", "MED"),
    player("m2", "MED"),
    player("m3", "MED"),
    player("m4", "MED"),
    player("f1", "DEL"),
    player("f2", "DEL"),
    player("bgk", "GK"),
    player("bd1", "DEF"),
    player("bm1", "MED"),
    player("bm2", "MED"),
    player("bf1", "DEL"),
  ];

  const playersById = new Map(players.map((p) => [p.id, p]));

  const selection: LineupSelection = {
    isValid: true,
    starterIds: [
      "gk1",
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
    ],
    benchIds: ["bgk", "bd1", "bm1", "bm2", "bf1"],
  };

  it("scores selected players even when lineup is incomplete (isValid false)", () => {
    const stats = new Map([
      [
        "f1",
        testStat("f1", "DEL", {
          minutes: 90,
          goals: 1,
          started: true,
        }),
      ],
      [
        "gk1",
        testStat("gk1", "GK", {
          minutes: 90,
          started: true,
          teamResult: "win",
        }),
      ],
    ]);

    const result = computeEffectiveLineup(
      {
        isValid: false,
        starterIds: ["gk1", "f1"],
        benchIds: [],
        captainId: "f1",
      },
      playersById,
      stats
    );

    expect(result.scoringPlayers).toHaveLength(2);
    const f1 = result.scoringPlayers.find((p) => p.playerId === "f1");
    expect(f1?.points).toBeGreaterThan(0);
    expect(f1?.isCaptain).toBe(true);
    expect(result.contractPlayerIds).toEqual(
      expect.arrayContaining(["gk1", "f1"])
    );
  });

  it("returns zero points when no players are selected", () => {
    const result = computeEffectiveLineup(
      { isValid: false, starterIds: [], benchIds: [] },
      playersById,
      new Map()
    );
    expect(result.scoringPlayers).toHaveLength(0);
  });

  it("auto-substitutes bench with strict position match", () => {
    const stats = new Map([
      ["f1", testStat("f1", "DEL", { minutes: 0 })],
      [
        "bf1",
        testStat("bf1", "DEL", {
          minutes: 90,
          goals: 1,
          started: true,
        }),
      ],
      [
        "gk1",
        testStat("gk1", "GK", {
          minutes: 90,
          started: true,
          teamResult: "win",
        }),
      ],
    ]);

    for (const id of [
      "d1",
      "d2",
      "d3",
      "d4",
      "m1",
      "m2",
      "m3",
      "m4",
      "f2",
    ]) {
      stats.set(
        id,
        testStat(id, id.startsWith("d") ? "DEF" : id.startsWith("m") ? "MED" : "DEL", {
          minutes: 60,
          started: true,
        })
      );
    }

    const result = computeEffectiveLineup(selection, playersById, stats);
    const bf1 = result.scoringPlayers.find((p) => p.playerId === "bf1");
    expect(bf1?.source).toBe("bench_sub");
    expect(bf1?.points).toBeGreaterThan(0);
    expect(result.contractPlayerIds).toContain("bf1");
  });

  it("does not use bench with wrong position", () => {
    const stats = new Map([["m2", testStat("m2", "MED", { minutes: 0 })]]);

    const result = computeEffectiveLineup(selection, playersById, stats);
    const m2Points = result.scoringPlayers.find((p) => p.playerId === "m2");
    expect(m2Points).toBeUndefined();
  });

  it("doubles captain points when captain plays", () => {
    const stats = new Map([
      [
        "f1",
        testStat("f1", "DEL", {
          minutes: 90,
          goals: 2,
          started: true,
        }),
      ],
    ]);

    const withoutCaptain = computeEffectiveLineup(selection, playersById, stats);
    const withCaptain = computeEffectiveLineup(
      { ...selection, captainId: "f1" },
      playersById,
      stats
    );

    const base = withoutCaptain.scoringPlayers.find((p) => p.playerId === "f1");
    const doubled = withCaptain.scoringPlayers.find((p) => p.playerId === "f1");
    expect(base?.points).toBe(19);
    expect(doubled?.points).toBe(38);
    expect(doubled?.isCaptain).toBe(true);
  });

  it("does not double captain bonus if captain did not score", () => {
    const stats = new Map([["f1", testStat("f1", "DEL", { minutes: 0 })]]);

    const result = computeEffectiveLineup(
      { ...selection, captainId: "f1" },
      playersById,
      stats
    );
    expect(result.scoringPlayers.find((p) => p.playerId === "f1")).toBeUndefined();
  });
});
