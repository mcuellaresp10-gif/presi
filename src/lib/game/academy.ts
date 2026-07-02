import type { RNG } from "./rng";
import { createMathRng } from "./rng";
import { MAX_SQUAD, SQUAD_POSITION_CAPS } from "./squad-limits";
import type { Player, Position, PositionCounts, Rarity } from "./types";

const POSITION_CAPS = SQUAD_POSITION_CAPS;

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

function pickAcademyRarity(rng: RNG): Rarity {
  const roll = rng.next() * 100;
  if (roll < 70) return "bronce";
  return "plata";
}

export function isAcademyPackReady(generaEn: string | Date): boolean {
  return new Date(generaEn).getTime() <= Date.now();
}

export function generateAcademyPlayer(
  pool: Player[],
  rosterCounts: PositionCounts,
  rng: RNG = createMathRng()
): Player | null {
  const rosterSize =
    rosterCounts.GK +
    rosterCounts.DEF +
    rosterCounts.MED +
    rosterCounts.DEL;
  if (rosterSize >= MAX_SQUAD) return null;

  const targetRarity = pickAcademyRarity(rng);
  const targetPosition = pickWeightedPosition(rosterCounts, rng);

  const eligible = pool.filter(
    (p) =>
      rosterCounts[p.posicion] < POSITION_CAPS[p.posicion] &&
      (p.rareza === "bronce" || p.rareza === "plata")
  );
  if (eligible.length === 0) return null;

  let candidates = eligible.filter((p) => p.rareza === targetRarity);
  if (targetPosition) {
    const byPos = candidates.filter((p) => p.posicion === targetPosition);
    if (byPos.length > 0) candidates = byPos;
  }
  if (candidates.length === 0) {
    candidates = targetPosition
      ? eligible.filter((p) => p.posicion === targetPosition)
      : eligible;
  }
  if (candidates.length === 0) candidates = eligible;

  const index = Math.floor(rng.next() * candidates.length);
  return candidates[index];
}
