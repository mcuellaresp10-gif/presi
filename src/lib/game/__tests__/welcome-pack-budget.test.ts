import { describe, expect, it } from "vitest";
import {
  calculateRosterCost,
  calculateRemainingBudget,
} from "../budget";
import { generatePackOptions } from "../pack-generator";
import { canAddPlayer, canFormValidEleven, countPositions } from "../roster";
import { createSeededRng } from "../rng";
import { assignStarterRoster } from "../starter-roster";
import type { Player } from "../types";
import { INITIAL_BUDGET } from "../types";

/** Mirrors tier cost ranges after player-rarity sync */
function buildSeedPool(): Player[] {
  const bronceCosts = [500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000];
  const plataCosts = [1_200_000, 1_400_000, 1_600_000];
  const oroCosts = [2_000_000];
  const leyendaCosts = [4_500_000];

  const costs = {
    GK: [...bronceCosts, ...plataCosts, ...oroCosts],
    DEF: [...bronceCosts, ...plataCosts, ...oroCosts],
    MED: [...bronceCosts, ...plataCosts, ...oroCosts],
    DEL: [...bronceCosts, ...plataCosts, ...oroCosts, ...leyendaCosts],
  };

  const rarities: Player["rareza"][][] = [
    ["bronce", "bronce", "bronce", "bronce", "bronce", "bronce", "plata", "plata", "plata", "oro"],
    ["bronce", "bronce", "bronce", "bronce", "bronce", "bronce", "plata", "plata", "plata", "oro"],
    ["bronce", "bronce", "bronce", "bronce", "bronce", "bronce", "plata", "plata", "plata", "oro"],
    ["bronce", "bronce", "bronce", "bronce", "bronce", "bronce", "plata", "plata", "oro", "leyenda"],
  ];

  const positions: Player["posicion"][] = ["GK", "DEF", "MED", "DEL"];
  const players: Player[] = [];
  let id = 0;

  positions.forEach((pos, posIndex) => {
    costs[pos].forEach((costo, i) => {
      players.push({
        id: `seed-${id++}`,
        api_football_id: null,
        nombre: `${pos} ${i}`,
        equipo_real: "Liga Colombiana",
        posicion: pos,
        rareza: rarities[posIndex][i],
        costo_base: costo,
      });
    });
  });

  return players;
}

function cheapestAffordable(pack: Player[], budget: number): Player | undefined {
  return [...pack]
    .filter((p) => p.costo_base <= budget)
    .sort((a, b) => a.costo_base - b.costo_base)[0];
}

describe("welcome pack budget guarantee", () => {
  const pool = buildSeedPool();

  it("starter roster stays within budget cap", () => {
    const starter = assignStarterRoster(pool);
    expect(starter).toHaveLength(11);
    expect(calculateRosterCost(starter)).toBeLessThanOrEqual(15_000_000);
  });

  it("for 1000 simulated clubs, cheapest affordable pick per pack stays within budget", () => {
    let failures = 0;

    for (let seed = 0; seed < 1000; seed++) {
      const starter = assignStarterRoster(pool);
      let roster = [...starter];
      let remaining = calculateRemainingBudget(INITIAL_BUDGET, roster);
      let failed = false;

      for (let pack = 0; pack < 4; pack++) {
        const options = generatePackOptions(
          pool.filter((p) => !roster.some((r) => r.id === p.id)),
          countPositions(roster),
          3,
          createSeededRng(seed * 10 + pack),
          remaining
        );

        const pick = cheapestAffordable(options, remaining);
        if (!pick) {
          failed = true;
          break;
        }

        const addCheck = canAddPlayer(roster, pick);
        if (!addCheck.ok) {
          failed = true;
          break;
        }

        roster = [...roster, pick];
        remaining -= pick.costo_base;
      }

      if (failed) {
        failures += 1;
        continue;
      }

      const totalCost = calculateRosterCost(roster);
      if (
        totalCost > INITIAL_BUDGET ||
        !canFormValidEleven(roster) ||
        remaining < 0
      ) {
        failures += 1;
      }
    }

    expect(failures).toBe(0);
  });
});
