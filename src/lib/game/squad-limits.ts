import type { Player, Position, PositionCounts } from "./types";
import { validateFormation } from "./formation";

export const MAX_SQUAD = 24;
export const STARTER_COUNT = 11;
export const BENCH_COUNT = 5;
export const MAX_RESERVE = 8;

export const SQUAD_POSITION_CAPS: PositionCounts = {
  GK: 3,
  DEF: 8,
  MED: 8,
  DEL: 7,
};

export type SquadRole = "starter" | "bench" | "reserve";

export function countPositions(players: Player[]): PositionCounts {
  return players.reduce(
    (counts, player) => {
      counts[player.posicion] += 1;
      return counts;
    },
    { GK: 0, DEF: 0, MED: 0, DEL: 0 }
  );
}

export function canAddPlayerToSquad(
  roster: Player[],
  player: Player
): { ok: true } | { ok: false; reason: string } {
  if (roster.some((p) => p.id === player.id)) {
    return { ok: false, reason: "Este jugador ya está en tu plantilla." };
  }

  if (roster.length >= MAX_SQUAD) {
    return { ok: false, reason: `Tu plantilla ya tiene ${MAX_SQUAD} jugadores.` };
  }

  const counts = countPositions(roster);
  const cap = SQUAD_POSITION_CAPS[player.posicion];
  if (counts[player.posicion] >= cap) {
    return {
      ok: false,
      reason: `Ya tienes el máximo de ${cap} jugadores en ${player.posicion}.`,
    };
  }

  return { ok: true };
}

function hasDuplicates(ids: string[]): boolean {
  return new Set(ids).size !== ids.length;
}

function allInRoster(ids: string[], rosterIds: Set<string>): boolean {
  return ids.every((id) => rosterIds.has(id));
}

export function validateLineupDraft(
  starterIds: string[],
  benchIds: string[],
  rosterPlayers: Player[]
): { ok: true; formation: string } | { ok: false; reason: string } {
  if (starterIds.length !== STARTER_COUNT) {
    return {
      ok: false,
      reason: `Necesitas ${STARTER_COUNT} titulares en el 11 inicial.`,
    };
  }

  if (benchIds.length !== BENCH_COUNT) {
    return {
      ok: false,
      reason: `Necesitas ${BENCH_COUNT} jugadores en la banca.`,
    };
  }

  if (hasDuplicates(starterIds) || hasDuplicates(benchIds)) {
    return { ok: false, reason: "No puedes repetir jugadores." };
  }

  const overlap = starterIds.some((id) => benchIds.includes(id));
  if (overlap) {
    return {
      ok: false,
      reason: "Un jugador no puede estar en el 11 y en la banca.",
    };
  }

  const rosterIds = new Set(rosterPlayers.map((p) => p.id));
  if (!allInRoster(starterIds, rosterIds) || !allInRoster(benchIds, rosterIds)) {
    return { ok: false, reason: "Todos deben pertenecer a tu plantilla." };
  }

  const starters = starterIds
    .map((id) => rosterPlayers.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  const formation = validateFormation(starters);
  if (!formation.valid) {
    return { ok: false, reason: formation.error };
  }

  return { ok: true, formation: formation.formation };
}

export function deriveReserveIds(
  rosterIds: string[],
  starterIds: string[],
  benchIds: string[]
): string[] {
  const used = new Set([...starterIds, ...benchIds]);
  return rosterIds.filter((id) => !used.has(id));
}

export function assignSquadRoles(
  rosterIds: string[],
  starterIds: string[],
  benchIds: string[]
): Map<string, SquadRole> {
  const roles = new Map<string, SquadRole>();
  for (const id of starterIds) roles.set(id, "starter");
  for (const id of benchIds) roles.set(id, "bench");
  for (const id of deriveReserveIds(rosterIds, starterIds, benchIds)) {
    roles.set(id, "reserve");
  }
  return roles;
}

export function getPositionCap(position: Position): number {
  return SQUAD_POSITION_CAPS[position];
}
