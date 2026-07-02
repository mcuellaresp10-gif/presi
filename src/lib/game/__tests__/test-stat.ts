import type { MatchStatLine } from "../scoring";
import { emptyMatchStatLine } from "../scoring";
import type { Player } from "../types";

export function testStat(
  playerId: string,
  posicion: Player["posicion"],
  overrides: Partial<MatchStatLine> = {}
): MatchStatLine {
  return { ...emptyMatchStatLine(playerId, posicion), ...overrides };
}
