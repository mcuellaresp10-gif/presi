import type { RNG } from "./rng";
import type { Player, Position, PositionCounts } from "./types";
import { POSITION_CAPS } from "./types";

function positionWeight(
  position: Position,
  rosterCounts: PositionCounts
): number {
  const remaining = POSITION_CAPS[position] - rosterCounts[position];
  if (remaining <= 0) return 0;
  return Math.pow(remaining, 2);
}

function pickWeightedPosition(
  rosterCounts: PositionCounts,
  rng: RNG
): Position | null {
  const positions: Position[] = ["GK", "DEF", "MED", "DEL"];
  const weights = positions.map((pos) => positionWeight(pos, rosterCounts));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return null;

  let roll = rng.next() * total;

  for (let i = 0; i < positions.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return positions[i];
  }

  return positions.find((pos) => positionWeight(pos, rosterCounts) > 0) ?? null;
}

function getEligiblePlayers(
  available: Player[],
  rosterCounts: PositionCounts
): Player[] {
  return available.filter(
    (player) => rosterCounts[player.posicion] < POSITION_CAPS[player.posicion]
  );
}

export function generatePackOptions(
  pool: Player[],
  rosterCounts: PositionCounts,
  count: number,
  rng: RNG,
  remainingBudget?: number
): Player[] {
  const available = [...pool];
  const options: Player[] = [];
  const simulatedCounts = { ...rosterCounts };

  const eligible = getEligiblePlayers(available, simulatedCounts);
  if (eligible.length === 0) return options;

  const affordable =
    remainingBudget !== undefined
      ? eligible.filter((p) => p.costo_base <= remainingBudget)
      : eligible;

  const anchorPool = affordable.length > 0 ? affordable : eligible;
  const anchor = [...anchorPool].sort((a, b) => a.costo_base - b.costo_base)[0];

  options.push(anchor);
  simulatedCounts[anchor.posicion] += 1;
  available.splice(
    available.findIndex((p) => p.id === anchor.id),
    1
  );

  while (options.length < count && available.length > 0) {
    const currentEligible = getEligiblePlayers(available, simulatedCounts);
    if (currentEligible.length === 0) break;

    const targetPosition = pickWeightedPosition(simulatedCounts, rng);
    const candidates = targetPosition
      ? currentEligible.filter((player) => player.posicion === targetPosition)
      : [];

    const pickFrom = candidates.length > 0 ? candidates : currentEligible;
    const chosen = pickFrom[Math.floor(rng.next() * pickFrom.length)];

    options.push(chosen);
    simulatedCounts[chosen.posicion] += 1;

    const removeIndex = available.findIndex((p) => p.id === chosen.id);
    if (removeIndex >= 0) available.splice(removeIndex, 1);
  }

  return options;
}
