import { describe, expect, it } from "vitest";
import {
  getFacilityUpgradeProgress,
  getUpgradeStatusCopy,
} from "../facility-upgrade-progress";

const base = {
  nivel: 3,
  mejora_inicia_en: "2026-01-01T10:00:00.000Z",
  mejora_termina_en: "2026-01-01T18:00:00.000Z",
};

describe("getFacilityUpgradeProgress", () => {
  it("returns null when no upgrade is active", () => {
    expect(
      getFacilityUpgradeProgress(
        { nivel: 2, mejora_inicia_en: null, mejora_termina_en: null },
        Date.now()
      )
    ).toBeNull();
  });

  it("computes progress from start and end timestamps", () => {
    const now = new Date("2026-01-01T14:00:00.000Z").getTime();
    const result = getFacilityUpgradeProgress(base, now);
    expect(result?.progress).toBe(0.5);
    expect(result?.remainingMs).toBe(4 * 60 * 60 * 1000);
    expect(result?.targetLevel).toBe(4);
    expect(result?.isCompletePending).toBe(false);
  });

  it("clamps progress between 0 and 1", () => {
    const before = getFacilityUpgradeProgress(
      base,
      new Date("2026-01-01T08:00:00.000Z").getTime()
    );
    expect(before?.progress).toBe(0);

    const after = getFacilityUpgradeProgress(
      base,
      new Date("2026-01-01T20:00:00.000Z").getTime()
    );
    expect(after?.progress).toBe(1);
    expect(after?.isCompletePending).toBe(true);
    expect(after?.remainingMs).toBe(0);
  });

  it("falls back to theoretical duration when start is null", () => {
    const end = new Date("2026-01-02T10:00:00.000Z").getTime();
    const result = getFacilityUpgradeProgress(
      {
        nivel: 1,
        mejora_inicia_en: null,
        mejora_termina_en: new Date(end).toISOString(),
      },
      end - 12 * 60 * 60 * 1000
    );
    expect(result?.isUpgrading).toBe(true);
    expect(result?.progress).toBeGreaterThan(0);
    expect(result?.progress).toBeLessThanOrEqual(1);
  });
});

describe("getUpgradeStatusCopy", () => {
  it("returns complete pending copy", () => {
    const copy = getUpgradeStatusCopy({
      isUpgrading: true,
      progress: 1,
      remainingMs: 0,
      isCompletePending: true,
      targetLevel: 4,
      totalDurationMs: 1000,
    });
    expect(copy.title).toBe("¡Obra terminada!");
  });
});
