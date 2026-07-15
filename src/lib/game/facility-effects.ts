import type { Facility } from "./types";
import {
  calculatePassiveIncomeTicks,
  clampFacilityLevel,
  getEstimatedWeeklyPassiveGems,
  getEstimatedWeeklyPassiveIncome,
  getLevelTimerMs,
  getPassiveGemTickAmount,
  HOUR_MS,
} from "./facility-progression";

export const HINCHAS_WILD_CARD_BONUS_PER_LEVEL = 1;
export const GYM_LEAGUE_BONUS_PER_LEVEL = 2;
export const OFFICE_DISCOUNT_PER_LEVEL = 0.015;

/** Estimated weekly income from hinchas alone (oficina at L1). */
export function getHinchasWeeklyIncome(nivel: number): number {
  return getEstimatedWeeklyPassiveIncome(clampFacilityLevel(nivel), 1);
}

/** +N% probabilidad de Wild Card en scouting (por nivel de hinchas). */
export function getHinchasWildCardBonusPct(nivel: number): number {
  return HINCHAS_WILD_CARD_BONUS_PER_LEVEL * clampFacilityLevel(nivel);
}

/** +N% puntos de jornada (por nivel de gimnasio). No se muestra en ranking. */
export function getGymLeagueBonusPct(nivel: number): number {
  return GYM_LEAGUE_BONUS_PER_LEVEL * clampFacilityLevel(nivel);
}

/** Aplica el % del gimnasio al total de puntos de una jornada. */
export function applyGymGameweekBonus(
  totalPoints: number,
  gymNivel: number
): number {
  const pct = getGymLeagueBonusPct(gymNivel);
  return Math.round(totalPoints * (1 + pct / 100));
}

/** Estimated weekly income from oficina alone (hinchas at L1). */
export function getOfficeWeeklyIncome(nivel: number): number {
  return getEstimatedWeeklyPassiveIncome(1, clampFacilityLevel(nivel));
}

export function getOfficeSigningDiscount(nivel: number): number {
  return OFFICE_DISCOUNT_PER_LEVEL * clampFacilityLevel(nivel);
}

export function applySigningDiscount(
  costoBase: number,
  discountRate: number
): number {
  return Math.round(costoBase * (1 - discountRate));
}

export function getAcademyDurationMs(nivel: number): number {
  return getLevelTimerMs(nivel, "academia");
}

export function getAcademyDurationHours(nivel: number): number {
  return getAcademyDurationMs(nivel) / HOUR_MS;
}

export function getNextAcademyDeadline(
  nivel: number,
  from: Date = new Date()
): Date {
  return new Date(from.getTime() + getAcademyDurationMs(nivel));
}

/** 0–1: reduce tarjetas y goles en contra en el cálculo de puntos. */
export function getMedicalPenaltyReduction(nivel: number): number {
  return Math.min(0.05 * clampFacilityLevel(nivel), 0.5);
}

export function getWeeklyPassiveIncome(facilities: Facility[]): number {
  const hinchasNivel = getFacilityNivel(facilities, "hinchas");
  const oficinaNivel = getFacilityNivel(facilities, "oficina");
  return getEstimatedWeeklyPassiveIncome(hinchasNivel, oficinaNivel);
}

export function calculatePassiveIncome(
  facilities: Facility[],
  lastIncomeAt: string | Date,
  now: Date = new Date()
): {
  ticks: number;
  amount: number;
  tickAmount: number;
  intervalMs: number;
} {
  const hinchasNivel = getFacilityNivel(facilities, "hinchas");
  const oficinaNivel = getFacilityNivel(facilities, "oficina");
  return calculatePassiveIncomeTicks(
    hinchasNivel,
    oficinaNivel,
    lastIncomeAt,
    now
  );
}

export function calculatePassiveGems(
  facilities: Facility[],
  lastIncomeAt: string | Date,
  now: Date = new Date()
): {
  ticks: number;
  amount: number;
  tickAmount: number;
  intervalMs: number;
} {
  const hinchasNivel = getFacilityNivel(facilities, "hinchas");
  const oficinaNivel = getFacilityNivel(facilities, "oficina");
  const income = calculatePassiveIncomeTicks(
    hinchasNivel,
    oficinaNivel,
    lastIncomeAt,
    now
  );
  const tickAmount = getPassiveGemTickAmount(hinchasNivel, oficinaNivel);

  return {
    ticks: income.ticks,
    amount: income.ticks * tickAmount,
    tickAmount,
    intervalMs: income.intervalMs,
  };
}

export function getWeeklyPassiveGems(facilities: Facility[]): number {
  const hinchasNivel = getFacilityNivel(facilities, "hinchas");
  const oficinaNivel = getFacilityNivel(facilities, "oficina");
  return getEstimatedWeeklyPassiveGems(hinchasNivel, oficinaNivel);
}

export function getFacilityNivel(
  facilities: Facility[],
  tipo: Facility["tipo"]
): number {
  return clampFacilityLevel(facilities.find((f) => f.tipo === tipo)?.nivel ?? 1);
}

export {
  getEstimatedWeeklyPassiveIncome,
  getEstimatedWeeklyPassiveGems,
  getPassiveIncomeIntervalHours,
  getPassiveIncomeTickAmount,
  getPassiveGemTickAmount,
  getHinchasTickAmount,
  getOfficeTickAmount,
  getNextIncomeTickAt,
} from "./facility-progression";
