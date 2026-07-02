import { calculateRosterCost } from "./budget";
import type { Player } from "./types";
import { MAX_STARTER_COST } from "./types";

const STARTER_COMPOSITION = {
  GK: 1,
  DEF: 4,
  MED: 3,
  DEL: 3,
} as const;

export function assignStarterRoster(allPlayers: Player[]): Player[] {
  const roster: Player[] = [];
  const usedIds = new Set<string>();

  (
    Object.keys(STARTER_COMPOSITION) as Array<keyof typeof STARTER_COMPOSITION>
  ).forEach((position) => {
    const needed = STARTER_COMPOSITION[position];
    const candidates = allPlayers
      .filter((p) => p.posicion === position && !usedIds.has(p.id))
      .sort((a, b) => a.costo_base - b.costo_base);

    for (let i = 0; i < needed && i < candidates.length; i++) {
      roster.push(candidates[i]);
      usedIds.add(candidates[i].id);
    }
  });

  if (
    roster.length !== 11 ||
    calculateRosterCost(roster) > MAX_STARTER_COST
  ) {
    throw new Error(
      "No se pudo asignar plantilla base dentro del presupuesto. Revisa el seed de jugadores."
    );
  }

  return roster;
}
