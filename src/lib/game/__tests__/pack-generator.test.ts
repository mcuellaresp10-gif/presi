import { describe, expect, it } from "vitest";
import { generatePackOptions } from "../pack-generator";
import { countPositions } from "../roster";
import { createSeededRng } from "../rng";
import type { Player } from "../types";

function buildPool(): Player[] {
  const positions: Player["posicion"][] = ["GK", "DEF", "MED", "DEL"];
  const players: Player[] = [];
  let id = 0;

  for (const pos of positions) {
    for (let i = 0; i < 10; i++) {
      players.push({
        id: `${pos}-${id++}`,
        api_football_id: null,
        nombre: `${pos} ${i}`,
        equipo_real: "Equipo",
        posicion: pos,
        rareza: "bronce",
        costo_base: 2_000_000,
      });
    }
  }

  return players;
}

describe("generatePackOptions", () => {
  it("almost never offers GK when roster has max GKs", () => {
    const pool = buildPool();
    const rosterCounts = { GK: 3, DEF: 8, MED: 8, DEL: 7 };
    let gkCount = 0;
    const runs = 500;

    for (let i = 0; i < runs; i++) {
      const options = generatePackOptions(
        pool,
        rosterCounts,
        3,
        createSeededRng(i)
      );
      gkCount += options.filter((p) => p.posicion === "GK").length;
    }

    expect(gkCount).toBe(0);
  });

  it("returns 3 unique options", () => {
    const pool = buildPool();
    const options = generatePackOptions(
      pool,
      countPositions([]),
      3,
      createSeededRng(42)
    );
    const ids = new Set(options.map((p) => p.id));
    expect(options).toHaveLength(3);
    expect(ids.size).toBe(3);
  });
});
