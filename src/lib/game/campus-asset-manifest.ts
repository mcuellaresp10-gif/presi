import {
  AI_IDLE_VERIFIED_CAMPUS_VARIANTS,
  AI_VERIFIED_CAMPUS_VARIANTS,
  CAMPUS_ASSET_INVENTORY,
  HAS_AI_MASTER_BACKGROUND,
} from "./campus-asset-inventory.generated";
import type { CampusBuildingVariant, CampusVisualTier, ConstructionStage } from "./campus-visual-tiers";

export type CampusAssetMode = "idle" | "construction";
export type CampusAssetFormat = "webp" | "png" | "svg";

export type CampusAssetQuery = {
  variant: CampusBuildingVariant;
  mode: CampusAssetMode;
  tier?: CampusVisualTier;
  stage?: ConstructionStage;
};

const CAMPUS_BASE = "/campus";

export const ILLUSTRATED_CAMPUS_VARIANTS: CampusBuildingVariant[] = [
  "stadium",
  "academy",
  "office",
  "finance",
  "medical",
  "gym",
];

export { AI_VERIFIED_CAMPUS_VARIANTS, AI_IDLE_VERIFIED_CAMPUS_VARIANTS };

export function hasAiVerifiedAssets(variant: CampusBuildingVariant): boolean {
  return AI_VERIFIED_CAMPUS_VARIANTS.includes(variant);
}

export function hasAiIdleAssets(variant: CampusBuildingVariant): boolean {
  return AI_IDLE_VERIFIED_CAMPUS_VARIANTS.includes(variant);
}

export function hasIllustratedAssets(variant: CampusBuildingVariant): boolean {
  return ILLUSTRATED_CAMPUS_VARIANTS.includes(variant);
}

export function hasAiMasterBackground(): boolean {
  return HAS_AI_MASTER_BACKGROUND;
}

function getSlotState(query: CampusAssetQuery) {
  const { variant, mode, tier = 1, stage = 1 } = query;
  const inventory = CAMPUS_ASSET_INVENTORY.variants[variant];
  if (mode === "idle") {
    return inventory.idle[`tier${tier}` as "tier1" | "tier2" | "tier3"];
  }
  return inventory.construction[`stage${stage}` as "stage1" | "stage2" | "stage3" | "stage4" | "stage5"];
}

function rasterToExt(raster: string | null | undefined): CampusAssetFormat {
  if (!raster) return "svg";
  if (raster === "webp") return "webp";
  if (raster === "png" || raster === "webp.png") return "png";
  return "svg";
}

export function getCampusAssetFormat(query: CampusAssetQuery): CampusAssetFormat {
  const slot = getSlotState(query);
  return rasterToExt(slot.raster);
}

export function getCampusAssetPath(
  query: CampusAssetQuery,
  format?: CampusAssetFormat
): string {
  const { variant, mode, tier = 1, stage = 1 } = query;
  const ext = format ?? getCampusAssetFormat(query);

  if (mode === "idle") {
    return `${CAMPUS_BASE}/buildings/${variant}/idle/tier-${tier}.${ext}`;
  }
  return `${CAMPUS_BASE}/buildings/${variant}/construction/stage-${stage}.${ext}`;
}

export function resolveCampusAssetSrc(query: CampusAssetQuery): string | null {
  const slot = getSlotState(query);
  if (!slot.raster && !slot.svg) return null;
  return getCampusAssetPath(query);
}

export function shouldUseAiCampusArt(
  variant: CampusBuildingVariant,
  mode: CampusAssetMode
): boolean {
  if (mode === "idle") return hasAiIdleAssets(variant);
  return hasAiVerifiedAssets(variant);
}

export function getCampusMasterBackground(): string {
  const master = CAMPUS_ASSET_INVENTORY.masterBackground;
  const ext = rasterToExt(master.raster);
  if (ext === "svg") return `${CAMPUS_BASE}/bg/master.svg`;
  return `${CAMPUS_BASE}/bg/master.${ext}`;
}

export function getCampusAsset(query: CampusAssetQuery): {
  src: string;
  alt: string;
  format: CampusAssetFormat;
} {
  const labels: Record<CampusBuildingVariant, string> = {
    stadium: "Estadio",
    academy: "Academia",
    office: "Scouting",
    finance: "Oficina",
    medical: "Centro médico",
    gym: "Gimnasio",
  };
  const format = getCampusAssetFormat(query);
  const src = getCampusAssetPath(query, format);
  const name = labels[query.variant];
  if (query.mode === "idle") {
    return { src, alt: `${name} tier ${query.tier ?? 1}`, format };
  }
  return { src, alt: `${name} en obra etapa ${query.stage ?? 1}`, format };
}

export type VehicleAnimationKind = "excavator" | "dump-truck";

export function getVehicleSpritePath(kind: VehicleAnimationKind): string {
  const inventory = CAMPUS_ASSET_INVENTORY.animations;
  const entry = kind === "excavator" ? inventory.excavator : inventory.dumpTruck;
  if (entry.raster) {
    const ext = entry.raster === "webp.png" ? "png" : entry.raster;
    return `${CAMPUS_BASE}/animations/${kind}-sheet.${ext}`;
  }
  return `${CAMPUS_BASE}/animations/${kind}-sheet.svg`;
}

export function hasAiVehicleSprites(): boolean {
  const { excavator, dumpTruck } = CAMPUS_ASSET_INVENTORY.animations;
  return Boolean(excavator.raster && dumpTruck.raster);
}

/** Per-slot calibration when IA art bounding boxes differ from procedural layout */
export const CAMPUS_SLOT_CALIBRATION: Record<
  CampusBuildingVariant,
  {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    /** CSS filter to harmonize lighting vs master background */
    filter?: string;
    /** Ground pedestal width multiplier (1 = default) */
    padScale?: number;
    /** CSS color for radial ground pedestal */
    padColor?: string;
  }
> = {
  stadium: {
    scale: 1.28,
    offsetY: 2,
    filter: "brightness(1.05) saturate(0.95)",
    padScale: 1.12,
    padColor: "rgba(26,51,40,0.92)",
  },
  academy: {
    scale: 1.25,
    offsetX: -2,
    offsetY: 0,
    filter: "brightness(0.92) saturate(0.9) contrast(1.05)",
    padScale: 1.05,
    padColor: "rgba(30,58,45,0.9)",
  },
  office: {
    scale: 1.22,
    offsetY: -2,
    filter: "brightness(0.98) saturate(0.94)",
    padScale: 1.0,
    padColor: "rgba(24,48,38,0.88)",
  },
  finance: {
    scale: 1.2,
    offsetX: 2,
    offsetY: 0,
    filter: "brightness(1.05) saturate(0.94)",
    padScale: 1.0,
    padColor: "rgba(22,44,34,0.9)",
  },
  medical: {
    scale: 1.22,
    offsetY: 2,
    filter: "brightness(1.05) saturate(0.94)",
    padScale: 1.05,
    padColor: "rgba(20,42,32,0.92)",
  },
  gym: {
    scale: 1.18,
    offsetX: -2,
    offsetY: 2,
    filter: "brightness(0.92) saturate(0.9) contrast(1.04)",
    padScale: 1.0,
    padColor: "rgba(28,54,42,0.88)",
  },
};

export const VEHICLE_PATHS: Record<
  CampusBuildingVariant,
  { truck: { startX: number; endX: number; y: number } }
> = {
  stadium: { truck: { startX: 5, endX: 75, y: 78 } },
  academy: { truck: { startX: 6, endX: 74, y: 82 } },
  office: { truck: { startX: 10, endX: 70, y: 82 } },
  finance: { truck: { startX: 8, endX: 74, y: 80 } },
  medical: { truck: { startX: 6, endX: 76, y: 79 } },
  gym: { truck: { startX: 10, endX: 72, y: 81 } },
};
