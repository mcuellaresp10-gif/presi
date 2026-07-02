import { describe, expect, it } from "vitest";
import { canAddPlayer } from "../roster";
import type { Player } from "../types";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    api_football_id: null,
    nombre: "Test Player",
    equipo_real: "Test FC",
    posicion: "MED",
    rareza: "bronce",
    costo_base: 3_000_000,
    ...overrides,
  };
}

describe("roster ownership", () => {
  it("blocks duplicate players in the same club roster", () => {
    const player = makePlayer({ id: "shared-player" });
    const roster = [player];

    const result = canAddPlayer(roster, player);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("ya está en tu plantilla");
    }
  });

  it("allows the same player for different clubs (independent rosters)", () => {
    const player = makePlayer({ id: "shared-player" });
    const clubARoster = [player];
    const clubBRoster: Player[] = [];

    expect(canAddPlayer(clubARoster, player).ok).toBe(false);
    expect(canAddPlayer(clubBRoster, player).ok).toBe(true);
  });

  it("allows different players in the same roster when caps permit", () => {
    const roster = [makePlayer({ id: "a", posicion: "MED" })];
    const other = makePlayer({ id: "b", posicion: "MED" });

    expect(canAddPlayer(roster, other).ok).toBe(true);
  });
});
