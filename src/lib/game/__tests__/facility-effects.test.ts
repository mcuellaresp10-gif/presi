import { describe, expect, it } from "vitest";
import {
  calculatePassiveGems,
  calculatePassiveIncome,
  getAcademyDurationHours,
  getEstimatedWeeklyPassiveIncome,
  getGymLeagueBonusPct,
  getHinchasWeeklyIncome,
  getHinchasWildCardBonusPct,
  getMedicalPenaltyReduction,
  getOfficeSigningDiscount,
  getPassiveGemTickAmount,
  getPassiveIncomeTickAmount,
  getWeeklyPassiveGems,
} from "../facility-effects";
import type { Facility } from "../types";

function makeFacilities(hinchasNivel: number, oficinaNivel: number): Facility[] {
  return [
    {
      club_id: "c1",
      tipo: "hinchas",
      nivel: hinchasNivel,
      mejora_inicia_en: null,
      mejora_termina_en: null,
    },
    {
      club_id: "c1",
      tipo: "oficina",
      nivel: oficinaNivel,
      mejora_inicia_en: null,
      mejora_termina_en: null,
    },
  ];
}

describe("facility-effects", () => {
  it("scales hinchas wild card bonus with level", () => {
    expect(getHinchasWildCardBonusPct(3)).toBe(3);
    expect(getHinchasWildCardBonusPct(10)).toBe(10);
  });

  it("scales gym bonus to 20% at level 10", () => {
    expect(getGymLeagueBonusPct(10)).toBe(20);
  });

  it("office signing discount scales to 15% at level 10", () => {
    expect(getOfficeSigningDiscount(1)).toBeCloseTo(0.015);
    expect(getOfficeSigningDiscount(10)).toBeCloseTo(0.15);
  });

  it("passive income returns zero for less than one tick", () => {
    const now = new Date("2026-01-08T00:00:00Z");
    const last = new Date("2026-01-07T18:00:00Z");
    const result = calculatePassiveIncome(makeFacilities(2, 1), last, now);
    expect(result.ticks).toBe(0);
    expect(result.amount).toBe(0);
  });

  it("passive income accrues multiple ticks", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    const now = new Date(last.getTime() + 12 * 60 * 60 * 1000 * 3);
    const result = calculatePassiveIncome(makeFacilities(2, 1), last, now);
    expect(result.ticks).toBe(3);
    expect(result.amount).toBe(result.tickAmount * 3);
  });

  it("L10 weekly income is much higher than L1", () => {
    const l1 = getEstimatedWeeklyPassiveIncome(1, 1);
    const l10 = getEstimatedWeeklyPassiveIncome(10, 10);
    expect(l10).toBeGreaterThan(l1 * 8);
  });

  it("academy duration is 48h at L1 and 16h at L10", () => {
    expect(getAcademyDurationHours(1)).toBe(48);
    expect(getAcademyDurationHours(10)).toBe(16);
  });

  it("medical penalty caps at 50%", () => {
    expect(getMedicalPenaltyReduction(10)).toBe(0.5);
  });

  it("tick amount grows with level", () => {
    expect(getPassiveIncomeTickAmount(5, 5)).toBeGreaterThan(
      getPassiveIncomeTickAmount(1, 1)
    );
  });

  it("hinchas weekly estimate increases with level", () => {
    expect(getHinchasWeeklyIncome(5)).toBeGreaterThan(getHinchasWeeklyIncome(1));
  });

  it("passive gems share ticks with money income", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    const now = new Date(last.getTime() + 12 * 60 * 60 * 1000 * 2);
    const facilities = makeFacilities(2, 1);
    const money = calculatePassiveIncome(facilities, last, now);
    const gems = calculatePassiveGems(facilities, last, now);
    expect(gems.ticks).toBe(money.ticks);
    expect(gems.amount).toBe(gems.tickAmount * gems.ticks);
  });

  it("gem tick amount grows with facility level", () => {
    expect(getPassiveGemTickAmount(5, 5)).toBeGreaterThan(
      getPassiveGemTickAmount(1, 1)
    );
    expect(getWeeklyPassiveGems(makeFacilities(5, 5))).toBeGreaterThan(
      getWeeklyPassiveGems(makeFacilities(1, 1))
    );
  });
});
