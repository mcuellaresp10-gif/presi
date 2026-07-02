import { describe, expect, it } from "vitest";
import { calculateRosterCost, calculateRemainingBudget } from "../budget";
import type { Player } from "../types";

const mockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: overrides.id ?? "1",
  api_football_id: null,
  nombre: "Test",
  equipo_real: "Equipo",
  posicion: "DEF",
  rareza: "bronce",
  costo_base: 3_000_000,
  ...overrides,
});

describe("budget", () => {
  it("calculates roster cost", () => {
    const players = [
      mockPlayer({ costo_base: 2_000_000 }),
      mockPlayer({ id: "2", costo_base: 5_000_000 }),
    ];
    expect(calculateRosterCost(players)).toBe(7_000_000);
  });

  it("calculates remaining budget", () => {
    const players = [mockPlayer({ costo_base: 10_000_000 })];
    expect(calculateRemainingBudget(50_000_000, players)).toBe(40_000_000);
  });

  it("excludes loan players from roster cost", () => {
    const players = [
      mockPlayer({ costo_base: 10_000_000 }),
      { ...mockPlayer({ id: "loan", costo_base: 8_000_000 }), es_prestamo: true },
    ];
    expect(calculateRosterCost(players)).toBe(10_000_000);
  });
});
