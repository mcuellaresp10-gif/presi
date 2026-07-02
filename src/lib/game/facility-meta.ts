import type { FacilityType } from "@/lib/game/types";
import {
  FACILITY_ICONS,
  FACILITY_LABELS,
} from "@/lib/game/types";
import {
  getAcademyDurationHours,
  getGymLeagueBonusPct,
  getHinchasTickAmount,
  getHinchasWildCardBonusPct,
  getMedicalPenaltyReduction,
  getOfficeSigningDiscount,
  getOfficeTickAmount,
  getPassiveIncomeIntervalHours,
  getPassiveIncomeTickAmount,
} from "./facility-effects";
import {
  getLevelTimerHours,
  getUpgradeCost,
  isMaxFacilityLevel,
} from "./facility-progression";
import {
  getScoutingDurationHours,
  getScoutingPremiumRarityPct,
} from "./scouting";

export function getFacilityEffectDescription(
  tipo: FacilityType,
  nivel: number
): string {
  switch (tipo) {
    case "hinchas": {
      const interval = getPassiveIncomeIntervalHours(nivel, 1);
      const tick = getHinchasTickAmount(nivel, interval);
      return `${formatCompact(tick)}/cobro (~${Math.round(interval)}h) + ${getHinchasWildCardBonusPct(nivel)}% Wild Card`;
    }
    case "scouting":
      return `Timer ~${getScoutingDurationHours(nivel)}h · ~${getScoutingPremiumRarityPct(nivel)}% oro/leyenda`;
    case "oficina": {
      const interval = getPassiveIncomeIntervalHours(1, nivel);
      const tick = getOfficeTickAmount(nivel, interval);
      return `${formatCompact(tick)}/cobro (~${Math.round(interval)}h) · ${Math.round(getOfficeSigningDiscount(nivel) * 100)}% dto. fichajes`;
    }
    case "academia":
      return `Promesa juvenil cada ~${getAcademyDurationHours(nivel)}h (bronce/plata)`;
    case "cuerpo_medico":
      return `-${Math.round(getMedicalPenaltyReduction(nivel) * 100)}% penalizaciones (tarjetas, GC)`;
    case "gimnasio":
      return `+${getGymLeagueBonusPct(nivel)}% puntos en ligas y ranking`;
    default:
      return "";
  }
}

export function getFacilityNextEffectDescription(
  tipo: FacilityType,
  nextNivel: number
): string {
  if (isMaxFacilityLevel(nextNivel - 1)) {
    return "Nivel máximo";
  }
  return getFacilityEffectDescription(tipo, nextNivel);
}

export function getFacilityUpgradeCostLabel(
  tipo: FacilityType,
  currentNivel: number
): string {
  if (isMaxFacilityLevel(currentNivel)) return "—";
  return formatCompact(getUpgradeCost(tipo, currentNivel));
}

export function getFacilityUpgradeBuildHours(currentNivel: number): number {
  return getLevelTimerHours(currentNivel, "build");
}

export function getCombinedIncomeDescription(
  hinchasNivel: number,
  oficinaNivel: number
): string {
  const interval = getPassiveIncomeIntervalHours(hinchasNivel, oficinaNivel);
  const tick = getPassiveIncomeTickAmount(hinchasNivel, oficinaNivel);
  return `${formatCompact(tick)} cada ~${Math.round(interval)}h`;
}

export function getFacilityLabel(tipo: FacilityType): string {
  return FACILITY_LABELS[tipo];
}

export function getFacilityIcon(tipo: FacilityType): string {
  return FACILITY_ICONS[tipo];
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}
