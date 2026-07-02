import type { RNG } from "./rng";
import { createMathRng } from "./rng";
import { clampFacilityLevel, getLevelTimerMs } from "./facility-progression";
import { MAX_SQUAD, SQUAD_POSITION_CAPS } from "./squad-limits";
import type { Player, Position, PositionCounts, Rarity } from "./types";

const POSITION_CAPS = SQUAD_POSITION_CAPS;

const HOUR_MS = 60 * 60 * 1000;

const RARITY_L1: Record<Rarity, number> = {
  bronce: 75,
  plata: 22,
  oro: 3,
  leyenda: 0,
};

const RARITY_L10: Record<Rarity, number> = {
  bronce: 25,
  plata: 30,
  oro: 30,
  leyenda: 15,
};

function interpolateRarityWeights(nivel: number): Record<Rarity, number> {
  const n = clampFacilityLevel(nivel);
  const t = (n - 1) / 9;
  const rarities: Rarity[] = ["bronce", "plata", "oro", "leyenda"];
  const weights = {} as Record<Rarity, number>;
  for (const r of rarities) {
    weights[r] = Math.round(RARITY_L1[r] + (RARITY_L10[r] - RARITY_L1[r]) * t);
  }
  return weights;
}

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

function pickWeightedRarity(nivel: number, rng: RNG): Rarity {
  const weights = getScoutingRarityWeights(nivel);
  const rarities: Rarity[] = ["bronce", "plata", "oro", "leyenda"];
  const values = rarities.map((r) => weights[r]);
  const total = values.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return "bronce";

  let roll = rng.next() * total;
  for (let i = 0; i < rarities.length; i++) {
    roll -= values[i];
    if (roll <= 0) return rarities[i];
  }
  return "bronce";
}

export function getScoutingDurationMs(nivel: number): number {
  return getLevelTimerMs(nivel, "scouting");
}

export function getScoutingDurationHours(nivel: number): number {
  return getScoutingDurationMs(nivel) / HOUR_MS;
}

export function getScoutingRarityWeights(nivel: number): Record<Rarity, number> {
  return interpolateRarityWeights(nivel);
}

/** % aproximado de oro + leyenda en el roll de rareza del scouting. */
export function getScoutingPremiumRarityPct(nivel: number): number {
  const weights = getScoutingRarityWeights(nivel);
  const total =
    weights.bronce + weights.plata + weights.oro + weights.leyenda;
  if (total <= 0) return 0;
  return Math.round(((weights.oro + weights.leyenda) / total) * 100);
}

export function getNextScoutingDeadline(
  nivel: number,
  from: Date = new Date()
): Date {
  return new Date(from.getTime() + getScoutingDurationMs(nivel));
}

/** Cap legacy 24h timers to the current max for scouting level. */
export function normalizeScoutingPackDeadline(
  generaEn: string | Date,
  scoutingNivel: number,
  from: Date = new Date()
): { generaEn: string; adjusted: boolean } {
  const maxAllowed = getNextScoutingDeadline(scoutingNivel, from).getTime();
  const current = new Date(generaEn).getTime();
  if (current > maxAllowed) {
    return {
      generaEn: new Date(maxAllowed).toISOString(),
      adjusted: true,
    };
  }
  return {
    generaEn: new Date(generaEn).toISOString(),
    adjusted: false,
  };
}

export function isScoutingPackReady(generaEn: string | Date): boolean {
  return new Date(generaEn).getTime() <= Date.now();
}

export function generateScoutingPlayer(
  pool: Player[],
  rosterCounts: PositionCounts,
  nivel: number,
  rng: RNG = createMathRng()
): Player | null {
  const rosterSize =
    rosterCounts.GK +
    rosterCounts.DEF +
    rosterCounts.MED +
    rosterCounts.DEL;
  if (rosterSize >= MAX_SQUAD) return null;

  const targetRarity = pickWeightedRarity(nivel, rng);
  const targetPosition = pickWeightedPosition(rosterCounts, rng);

  const eligible = pool.filter(
    (p) => rosterCounts[p.posicion] < POSITION_CAPS[p.posicion]
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

export type ScoutingEstado = "timer" | "listo" | "reclamado";

export interface ScoutingPackState {
  club_id: string;
  genera_en: string;
  player_id: string | null;
  estado: ScoutingEstado;
  scouting_nivel: number;
}
