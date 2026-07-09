import { clampFacilityLevel } from "./facility-progression";
import type { FacilityType } from "./types";

export type CampusBuildingVariant =
  | "stadium"
  | "academy"
  | "office"
  | "finance"
  | "medical"
  | "gym";

export type CampusVisualTier = 1 | 2 | 3;
export type ConstructionStage = 1 | 2 | 3 | 4 | 5;

const TIER_LABELS: Record<CampusVisualTier, string> = {
  1: "Bronce",
  2: "Plata",
  3: "Oro",
};

const TIER_SCALE_MULTIPLIER: Record<CampusVisualTier, number> = {
  1: 1,
  2: 1.12,
  3: 1.22,
};

export function getCampusVisualTier(nivel: number): CampusVisualTier {
  const n = clampFacilityLevel(nivel);
  if (n <= 3) return 1;
  if (n <= 6) return 2;
  return 3;
}

export function getCampusVisualTierLabel(nivel: number): string {
  return TIER_LABELS[getCampusVisualTier(nivel)];
}

export function getCampusBuildingScale(
  nivel: number,
  baseScale = 1
): number {
  const tier = getCampusVisualTier(nivel);
  return baseScale * TIER_SCALE_MULTIPLIER[tier];
}

export function getConstructionStage(progress: number): ConstructionStage {
  const p = Math.min(1, Math.max(0, progress));
  if (p >= 1) return 5;
  if (p >= 0.75) return 4;
  if (p >= 0.5) return 3;
  if (p >= 0.25) return 2;
  return 1;
}

export function getTargetCampusVisualTier(
  currentNivel: number
): CampusVisualTier {
  return getCampusVisualTier(currentNivel + 1);
}

export const FACILITY_CAMPUS_VARIANT: Record<FacilityType, CampusBuildingVariant> =
  {
    hinchas: "stadium",
    academia: "academy",
    scouting: "office",
    oficina: "finance",
    cuerpo_medico: "medical",
    gimnasio: "gym",
  };

export function getFacilityCampusVariant(tipo: FacilityType): CampusBuildingVariant {
  return FACILITY_CAMPUS_VARIANT[tipo];
}
