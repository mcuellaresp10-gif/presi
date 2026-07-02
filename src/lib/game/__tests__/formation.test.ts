import { describe, expect, it } from "vitest";
import { validateFormation, VALID_FORMATIONS } from "../formation";
import type { Player } from "../types";

const p = (
  id: string,
  posicion: Player["posicion"]
): Player => ({
  id,
  api_football_id: null,
  nombre: id,
  equipo_real: "Equipo",
  posicion,
  rareza: "bronce",
  costo_base: 1_000_000,
});

describe("validateFormation", () => {
  it("accepts valid 4-4-2", () => {
    const starters = [
      p("gk", "GK"),
      ...Array.from({ length: 4 }, (_, i) => p(`d${i}`, "DEF")),
      ...Array.from({ length: 4 }, (_, i) => p(`m${i}`, "MED")),
      ...Array.from({ length: 2 }, (_, i) => p(`f${i}`, "DEL")),
    ];
    expect(validateFormation(starters)).toEqual({
      valid: true,
      formation: "4-4-2",
    });
  });

  it("rejects invalid formation", () => {
    const starters = [
      p("gk", "GK"),
      ...Array.from({ length: 4 }, (_, i) => p(`d${i}`, "DEF")),
      ...Array.from({ length: 2 }, (_, i) => p(`m${i}`, "MED")),
      ...Array.from({ length: 4 }, (_, i) => p(`f${i}`, "DEL")),
    ];
    const result = validateFormation(starters);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("4-2-4");
    }
  });

  it("has exactly 7 valid formations", () => {
    expect(VALID_FORMATIONS).toHaveLength(7);
  });
});
