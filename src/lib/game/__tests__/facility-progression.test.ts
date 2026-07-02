import { describe, expect, it } from "vitest";
import {
  calculatePassiveIncomeTicks,
  clampFacilityLevel,
  getEstimatedWeeklyPassiveIncome,
  getLevelTimerHours,
  getPassiveIncomeTickAmount,
  getUpgradeCost,
  getUpgradeBuildDurationMs,
  isMaxFacilityLevel,
  MAX_FACILITY_LEVEL,
} from "../facility-progression";

describe("facility-progression", () => {
  it("clamps level to 1-10", () => {
    expect(clampFacilityLevel(0)).toBe(1);
    expect(clampFacilityLevel(15)).toBe(10);
    expect(isMaxFacilityLevel(10)).toBe(true);
    expect(isMaxFacilityLevel(9)).toBe(false);
  });

  it("scouting timer is 12h at L1 and 4h at L10", () => {
    expect(getLevelTimerHours(1, "scouting")).toBe(12);
    expect(getLevelTimerHours(10, "scouting")).toBe(4);
    expect(getLevelTimerHours(5, "scouting")).toBeCloseTo(8, 0);
  });

  it("academia timer is 48h at L1 and 16h at L10", () => {
    expect(getLevelTimerHours(1, "academia")).toBe(48);
    expect(getLevelTimerHours(10, "academia")).toBe(16);
  });

  it("build timer is 24h at L1 and 8h at L10", () => {
    expect(getLevelTimerHours(1, "build")).toBe(24);
    expect(getLevelTimerHours(10, "build")).toBe(8);
  });

  it("upgrade cost scales with (n+1)^2", () => {
    expect(getUpgradeCost("scouting", 1)).toBe(4_000_000);
    expect(getUpgradeCost("hinchas", 2)).toBe(800_000 * 9);
    expect(getUpgradeCost("scouting", 10)).toBe(Infinity);
  });

  it("upgrade build duration uses build profile", () => {
    expect(getUpgradeBuildDurationMs(1)).toBe(24 * 60 * 60 * 1000);
  });

  it("passive income grows aggressively from L1 to L10", () => {
    const l1Weekly = getEstimatedWeeklyPassiveIncome(1, 1);
    const l10Weekly = getEstimatedWeeklyPassiveIncome(10, 10);
    expect(l10Weekly).toBeGreaterThan(l1Weekly * 8);
  });

  it("calculatePassiveIncomeTicks accrues full ticks", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    const now = new Date(last.getTime() + 12 * 60 * 60 * 1000 * 2);
    const result = calculatePassiveIncomeTicks(1, 1, last, now);
    expect(result.ticks).toBe(2);
    expect(result.amount).toBe(result.tickAmount * 2);
  });

  it("tick amount increases with level", () => {
    const l1 = getPassiveIncomeTickAmount(1, 1);
    const l5 = getPassiveIncomeTickAmount(5, 5);
    expect(l5).toBeGreaterThan(l1);
  });

  it("max facility level constant is 10", () => {
    expect(MAX_FACILITY_LEVEL).toBe(10);
  });
});
