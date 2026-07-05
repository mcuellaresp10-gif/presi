import type { FacilityType } from "./types";

export const MAX_FACILITY_LEVEL = 10;
export const HOUR_MS = 60 * 60 * 1000;

export const HINCHAS_TICK_BASE = 150_000;
export const OFFICE_TICK_BASE = 100_000;
export const HINCHAS_GEM_TICK_BASE = 2;
export const OFFICE_GEM_TICK_BASE = 1;

export type TimerProfile = "scouting" | "academia" | "income" | "build";

const TIMER_PROFILES: Record<
  TimerProfile,
  { maxHours: number; minHours: number }
> = {
  scouting: { maxHours: 12, minHours: 4 },
  income: { maxHours: 6, minHours: 2 },
  academia: { maxHours: 48, minHours: 16 },
  build: { maxHours: 24, minHours: 8 },
};

const UPGRADE_BASE_COST: Record<FacilityType, number> = {
  hinchas: 800_000,
  oficina: 600_000,
  scouting: 1_000_000,
  academia: 900_000,
  cuerpo_medico: 700_000,
  gimnasio: 700_000,
};

export function clampFacilityLevel(nivel: number): number {
  return Math.min(MAX_FACILITY_LEVEL, Math.max(1, Math.floor(nivel)));
}

export function isMaxFacilityLevel(nivel: number): boolean {
  return clampFacilityLevel(nivel) >= MAX_FACILITY_LEVEL;
}

export function getLevelTimerHours(
  nivel: number,
  profile: TimerProfile = "scouting"
): number {
  const n = clampFacilityLevel(nivel);
  const { maxHours, minHours } = TIMER_PROFILES[profile];
  const hours = maxHours - ((maxHours - minHours) * (n - 1)) / 9;
  return Math.round(hours * 10) / 10;
}

export function getLevelTimerMs(
  nivel: number,
  profile: TimerProfile = "scouting"
): number {
  return getLevelTimerHours(nivel, profile) * HOUR_MS;
}

export function getUpgradeCost(
  tipo: FacilityType,
  currentNivel: number
): number {
  const n = clampFacilityLevel(currentNivel);
  if (n >= MAX_FACILITY_LEVEL) return Infinity;
  const base = UPGRADE_BASE_COST[tipo];
  const targetLevel = n + 1;
  return base * targetLevel * targetLevel;
}

export function getUpgradeBuildDurationMs(currentNivel: number): number {
  return getLevelTimerMs(currentNivel, "build");
}

/** Combined income interval from average hinchas + oficina level. */
export function getPassiveIncomeIntervalMs(
  hinchasNivel: number,
  oficinaNivel: number
): number {
  const avgLevel = (clampFacilityLevel(hinchasNivel) + clampFacilityLevel(oficinaNivel)) / 2;
  return getLevelTimerMs(avgLevel, "income");
}

export function getPassiveIncomeIntervalHours(
  hinchasNivel: number,
  oficinaNivel: number
): number {
  return getPassiveIncomeIntervalMs(hinchasNivel, oficinaNivel) / HOUR_MS;
}

function tickSpeedMultiplier(intervalHours: number): number {
  const incomeL1Hours = getLevelTimerHours(1, "income");
  return incomeL1Hours / intervalHours;
}

export function getHinchasTickAmount(hinchasNivel: number, intervalHours: number): number {
  const n = clampFacilityLevel(hinchasNivel);
  return Math.round(HINCHAS_TICK_BASE * n * tickSpeedMultiplier(intervalHours));
}

export function getOfficeTickAmount(oficinaNivel: number, intervalHours: number): number {
  const n = clampFacilityLevel(oficinaNivel);
  return Math.round(OFFICE_TICK_BASE * n * tickSpeedMultiplier(intervalHours));
}

export function getPassiveIncomeTickAmount(
  hinchasNivel: number,
  oficinaNivel: number
): number {
  const intervalHours = getPassiveIncomeIntervalHours(hinchasNivel, oficinaNivel);
  return (
    getHinchasTickAmount(hinchasNivel, intervalHours) +
    getOfficeTickAmount(oficinaNivel, intervalHours)
  );
}

export function getHinchasGemTickAmount(
  hinchasNivel: number,
  intervalHours: number
): number {
  const n = clampFacilityLevel(hinchasNivel);
  return Math.max(
    1,
    Math.round(HINCHAS_GEM_TICK_BASE * n * tickSpeedMultiplier(intervalHours))
  );
}

export function getOfficeGemTickAmount(
  oficinaNivel: number,
  intervalHours: number
): number {
  const n = clampFacilityLevel(oficinaNivel);
  return Math.max(
    1,
    Math.round(OFFICE_GEM_TICK_BASE * n * tickSpeedMultiplier(intervalHours))
  );
}

export function getPassiveGemTickAmount(
  hinchasNivel: number,
  oficinaNivel: number
): number {
  const intervalHours = getPassiveIncomeIntervalHours(hinchasNivel, oficinaNivel);
  return (
    getHinchasGemTickAmount(hinchasNivel, intervalHours) +
    getOfficeGemTickAmount(oficinaNivel, intervalHours)
  );
}

export function getEstimatedWeeklyPassiveGems(
  hinchasNivel: number,
  oficinaNivel: number
): number {
  const intervalMs = getPassiveIncomeIntervalMs(hinchasNivel, oficinaNivel);
  const tickAmount = getPassiveGemTickAmount(hinchasNivel, oficinaNivel);
  const weekMs = 7 * 24 * HOUR_MS;
  const ticksPerWeek = weekMs / intervalMs;
  return Math.round(ticksPerWeek * tickAmount);
}

export function getNextIncomeTickAt(
  hinchasNivel: number,
  oficinaNivel: number,
  lastIncomeAt: string | Date,
  now: Date = new Date()
): Date {
  const intervalMs = getPassiveIncomeIntervalMs(hinchasNivel, oficinaNivel);
  const last = new Date(lastIncomeAt).getTime();
  const elapsed = Math.max(0, now.getTime() - last);
  const ticksCompleted = Math.floor(elapsed / intervalMs);
  return new Date(last + (ticksCompleted + 1) * intervalMs);
}

export function calculatePassiveIncomeTicks(
  hinchasNivel: number,
  oficinaNivel: number,
  lastIncomeAt: string | Date,
  now: Date = new Date()
): { ticks: number; amount: number; intervalMs: number; tickAmount: number } {
  const intervalMs = getPassiveIncomeIntervalMs(hinchasNivel, oficinaNivel);
  const tickAmount = getPassiveIncomeTickAmount(hinchasNivel, oficinaNivel);
  const elapsed = now.getTime() - new Date(lastIncomeAt).getTime();
  const ticks = Math.floor(elapsed / intervalMs);

  if (ticks <= 0) {
    return { ticks: 0, amount: 0, intervalMs, tickAmount };
  }

  return {
    ticks,
    amount: ticks * tickAmount,
    intervalMs,
    tickAmount,
  };
}

/** Estimated weekly income at current tick rate (for UI comparison). */
export function getEstimatedWeeklyPassiveIncome(
  hinchasNivel: number,
  oficinaNivel: number
): number {
  const intervalMs = getPassiveIncomeIntervalMs(hinchasNivel, oficinaNivel);
  const tickAmount = getPassiveIncomeTickAmount(hinchasNivel, oficinaNivel);
  const weekMs = 7 * 24 * HOUR_MS;
  const ticksPerWeek = weekMs / intervalMs;
  return Math.round(ticksPerWeek * tickAmount);
}
