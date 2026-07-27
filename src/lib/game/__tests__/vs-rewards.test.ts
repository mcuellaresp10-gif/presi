import { describe, expect, it } from "vitest";
import {
  generateVsStreakPack,
  nextVsWinStreak,
  resolveRivalClubId,
  resolveVsOutcome,
  VS_STREAK_TARGET,
} from "@/lib/game/vs-rewards";
import { createSeededRng } from "@/lib/game/rng";
import type { Player } from "@/lib/game/types";

describe("vs rewards", () => {
  it("resolves win/loss/draw", () => {
    expect(resolveVsOutcome(40, 30)).toBe("win");
    expect(resolveVsOutcome(20, 30)).toBe("loss");
    expect(resolveVsOutcome(30, 30)).toBe("draw");
  });

  it("increments streak on win and resets otherwise", () => {
    expect(nextVsWinStreak(2, "win")).toBe(3);
    expect(nextVsWinStreak(4, "win")).toBe(VS_STREAK_TARGET);
    expect(nextVsWinStreak(3, "loss")).toBe(0);
    expect(nextVsWinStreak(3, "draw")).toBe(0);
  });

  it("picks rival one place above, or #2 when first", () => {
    const ranked = [
      { id: "a", puntos: 100 },
      { id: "b", puntos: 80 },
      { id: "c", puntos: 60 },
    ];
    expect(resolveRivalClubId(ranked, "c")).toBe("b");
    expect(resolveRivalClubId(ranked, "b")).toBe("a");
    expect(resolveRivalClubId(ranked, "a")).toBe("b");
  });

  it("generates streak pack with WC and up to 3 players including oro+", () => {
    const pool: Player[] = [];
    for (let i = 0; i < 30; i++) {
      pool.push({
        id: `p-${i}`,
        nombre: `P${i}`,
        equipo_real: "Test",
        posicion: (["GK", "DEF", "MED", "DEL"] as const)[i % 4]!,
        rareza: (["bronce", "plata", "oro", "leyenda"] as const)[i % 4]!,
        costo_base: 1_000_000,
        api_football_id: i + 1,
      });
    }
    const pack = generateVsStreakPack(
      pool,
      { GK: 0, DEF: 0, MED: 0, DEL: 0 },
      8,
      createSeededRng(42)
    );
    expect(pack.wildCardType).toBeTruthy();
    expect(pack.players.length).toBeGreaterThan(0);
    expect(pack.players.length).toBeLessThanOrEqual(3);
    expect(
      pack.players.some((p) => p.rareza === "oro" || p.rareza === "leyenda")
    ).toBe(true);
  });
});
