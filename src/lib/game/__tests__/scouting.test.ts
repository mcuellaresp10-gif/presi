import { describe, expect, it } from "vitest";
import {
  generateScoutingPlayer,
  getNextScoutingDeadline,
  getScoutingDurationHours,
  getScoutingDurationMs,
  getScoutingPremiumRarityPct,
  getScoutingRarityWeights,
  isScoutingPackReady,
  normalizeScoutingPackDeadline,
} from "../scouting";
import { countPositions } from "../roster";
import { createSeededRng } from "../rng";
import type { Player } from "../types";

function buildPool(): Player[] {
  const rarities: Player["rareza"][] = ["bronce", "plata", "oro", "leyenda"];
  const positions: Player["posicion"][] = ["GK", "DEF", "MED", "DEL"];
  const players: Player[] = [];
  let id = 0;

  for (const pos of positions) {
    for (const rareza of rarities) {
      for (let i = 0; i < 3; i++) {
        players.push({
          id: `${pos}-${rareza}-${id++}`,
          api_football_id: null,
          nombre: `${pos} ${rareza}`,
          equipo_real: "Test FC",
          posicion: pos,
          rareza,
          costo_base: 3_000_000,
        });
      }
    }
  }
  return players;
}

describe("scouting", () => {
  it("duration is 12h at L1 and 4h at L10", () => {
    expect(getScoutingDurationHours(1)).toBe(12);
    expect(getScoutingDurationHours(10)).toBe(4);
    expect(getScoutingDurationMs(1)).toBeGreaterThan(getScoutingDurationMs(5));
  });

  it("rarity weights improve with level", () => {
    const l1 = getScoutingRarityWeights(1);
    const l10 = getScoutingRarityWeights(10);
    expect(l10.oro).toBeGreaterThan(l1.oro);
    expect(l10.leyenda).toBeGreaterThan(l1.leyenda);
    expect(l1.bronce).toBeGreaterThan(l10.bronce);
    expect(getScoutingPremiumRarityPct(10)).toBeGreaterThan(
      getScoutingPremiumRarityPct(1)
    );
  });

  it("getNextScoutingDeadline adds correct duration", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const next = getNextScoutingDeadline(2, from);
    expect(next.getTime() - from.getTime()).toBe(
      getScoutingDurationMs(2)
    );
  });

  it("normalizeScoutingPackDeadline caps legacy 24h timers", () => {
    const from = new Date("2026-01-01T12:00:00Z");
    const legacy = new Date(from.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const result = normalizeScoutingPackDeadline(legacy, 1, from);
    expect(result.adjusted).toBe(true);
    expect(new Date(result.generaEn).getTime()).toBe(
      from.getTime() + getScoutingDurationMs(1)
    );
  });

  it("isScoutingPackReady detects expired timer", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isScoutingPackReady(past)).toBe(true);
    expect(isScoutingPackReady(future)).toBe(false);
  });

  it("generateScoutingPlayer returns eligible player", () => {
    const pool = buildPool();
    const roster: Player[] = [];
    const player = generateScoutingPlayer(
      pool,
      countPositions(roster),
      3,
      createSeededRng(42)
    );
    expect(player).not.toBeNull();
    expect(pool.some((p) => p.id === player!.id)).toBe(true);
  });

  it("generateScoutingPlayer returns null when roster is full", () => {
    const pool = buildPool();
    const fullRoster = pool.slice(0, 24);
    const player = generateScoutingPlayer(
      pool,
      countPositions(fullRoster),
      3,
      createSeededRng(1)
    );
    expect(player).toBeNull();
  });
});
