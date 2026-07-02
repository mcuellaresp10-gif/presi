import type { Player, Position } from "./types";
import {
  canAddPlayerToSquad,
  countPositions,
  MAX_SQUAD,
  SQUAD_POSITION_CAPS,
} from "./squad-limits";

export { countPositions, MAX_SQUAD, SQUAD_POSITION_CAPS as POSITION_CAPS };

export function canAddPlayer(
  roster: Player[],
  player: Player
): { ok: true } | { ok: false; reason: string } {
  return canAddPlayerToSquad(roster, player);
}

export function canFormValidEleven(players: Player[]): boolean {
  const counts = countPositions(players);
  return (
    counts.GK >= 1 &&
    counts.DEF >= 3 &&
    counts.MED >= 3 &&
    counts.DEL >= 1 &&
    counts.DEF + counts.MED + counts.DEL >= 10
  );
}

export function groupByPosition(players: Player[]): Record<Position, Player[]> {
  return {
    GK: players.filter((p) => p.posicion === "GK"),
    DEF: players.filter((p) => p.posicion === "DEF"),
    MED: players.filter((p) => p.posicion === "MED"),
    DEL: players.filter((p) => p.posicion === "DEL"),
  };
}
