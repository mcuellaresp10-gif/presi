import { describe, expect, it } from "vitest";
import {
  buildStarterSlotMapFromIds,
  canPlacePlayerOnStarterSlot,
  slotKeyPosition,
  starterIdsFromSlotMap,
} from "../lineup-slots";
import type { Player } from "../types";

const players: Player[] = [
  { id: "gk1", nombre: "Portero", posicion: "GK", equipo_real: "A", valor: 5 },
  { id: "def1", nombre: "Defensa", posicion: "DEF", equipo_real: "A", valor: 5 },
  { id: "med1", nombre: "Medio", posicion: "MED", equipo_real: "A", valor: 5 },
  { id: "del1", nombre: "Delantero", posicion: "DEL", equipo_real: "A", valor: 5 },
];

const byId = new Map(players.map((p) => [p.id, p]));

describe("lineup-slots", () => {
  it("maps starters into position slots", () => {
    const map = buildStarterSlotMapFromIds(
      "4-4-2",
      ["gk1", "def1", "med1", "del1"],
      byId
    );
    expect(map["GK-0"]).toBe("gk1");
    expect(map["DEF-0"]).toBe("def1");
    expect(map["MED-0"]).toBe("med1");
    expect(map["DEL-0"]).toBe("del1");
    expect(starterIdsFromSlotMap(map)).toHaveLength(4);
  });

  it("enforces position on starter slots", () => {
    expect(canPlacePlayerOnStarterSlot(players[1], "DEF")).toBe(true);
    expect(canPlacePlayerOnStarterSlot(players[1], "MED")).toBe(false);
    expect(slotKeyPosition("DEF-2")).toBe("DEF");
  });
});
