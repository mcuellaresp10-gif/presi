import type { Player } from "./types";

export function calculateRosterCost(players: Player[]): number {
  return players.reduce((sum, player) => sum + player.costo_base, 0);
}

export function calculateRemainingBudget(
  initial: number,
  roster: Player[]
): number {
  return initial - calculateRosterCost(roster);
}
