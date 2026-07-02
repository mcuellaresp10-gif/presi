import type { Player, RosterPlayer } from "./types";

export function calculateRosterCost(players: Array<Player | RosterPlayer>): number {
  return players
    .filter((player) => !("es_prestamo" in player && player.es_prestamo))
    .reduce((sum, player) => sum + player.costo_base, 0);
}

export function calculateRemainingBudget(
  initial: number,
  roster: Array<Player | RosterPlayer>
): number {
  return initial - calculateRosterCost(roster);
}
