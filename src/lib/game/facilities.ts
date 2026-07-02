import type { Facility, FacilityType } from "./types";
import {
  getUpgradeBuildDurationMs,
  getUpgradeCost,
  isMaxFacilityLevel,
} from "./facility-progression";

export const MAX_CONCURRENT_UPGRADES = 2;

export function getUpgradeDurationMs(nivel: number): number {
  return getUpgradeBuildDurationMs(nivel);
}

export function getActiveUpgrades(facilities: Facility[]): Facility[] {
  return facilities.filter(
    (facility) =>
      facility.mejora_termina_en !== null &&
      new Date(facility.mejora_termina_en).getTime() > Date.now()
  );
}

export function canStartUpgrade(
  facilities: Facility[],
  tipo: FacilityType,
  presupuesto: number
): { ok: true; cost: number } | { ok: false; reason: string } {
  const facility = facilities.find((f) => f.tipo === tipo);
  if (!facility) {
    return { ok: false, reason: "Instalación no encontrada." };
  }

  if (isMaxFacilityLevel(facility.nivel)) {
    return { ok: false, reason: "Nivel máximo alcanzado (10)." };
  }

  if (
    facility.mejora_termina_en &&
    new Date(facility.mejora_termina_en).getTime() > Date.now()
  ) {
    return { ok: false, reason: "Esta instalación ya se está mejorando." };
  }

  const active = getActiveUpgrades(facilities);
  if (active.length >= MAX_CONCURRENT_UPGRADES) {
    return {
      ok: false,
      reason: "Solo puedes mejorar 2 instalaciones a la vez.",
    };
  }

  const cost = getUpgradeCost(tipo, facility.nivel);
  if (presupuesto < cost) {
    return {
      ok: false,
      reason: `Presupuesto insuficiente (necesitas ${cost.toLocaleString("es-CO")} COP).`,
    };
  }

  return { ok: true, cost };
}

export function isUpgradeComplete(facility: Facility): boolean {
  if (!facility.mejora_termina_en) return false;
  return new Date(facility.mejora_termina_en).getTime() <= Date.now();
}

export function getRemainingMs(facility: Facility): number {
  if (!facility.mejora_termina_en) return 0;
  return Math.max(
    0,
    new Date(facility.mejora_termina_en).getTime() - Date.now()
  );
}

export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export { getUpgradeCost, isMaxFacilityLevel } from "./facility-progression";
