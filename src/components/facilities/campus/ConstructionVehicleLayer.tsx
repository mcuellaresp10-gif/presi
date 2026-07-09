"use client";

import {
  getVehicleSpritePath,
  hasAiVehicleSprites,
  VEHICLE_PATHS,
} from "@/lib/game/campus-asset-manifest";
import type { CampusBuildingVariant } from "@/lib/game/campus-visual-tiers";
import type { ConstructionStage } from "@/lib/game/campus-visual-tiers";
import { cn } from "@/lib/utils";

export function ConstructionVehicleLayer({
  variant,
  stage,
  size,
}: {
  variant: CampusBuildingVariant;
  stage: ConstructionStage;
  size: number;
}) {
  const paths = VEHICLE_PATHS[variant];
  const showExcavator = stage <= 2;
  const showTruck = stage >= 2 && stage <= 4;
  const scale = size / 88;
  const useAiSprites = hasAiVehicleSprites();
  const sheetScale = useAiSprites ? 512 : 192;
  const frameW = useAiSprites ? 128 : 48;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {showExcavator ? (
        <div
          className={cn("campus-excavator absolute")}
          style={{
            left: `${8 * scale}px`,
            bottom: `${12 * scale}px`,
            width: `${frameW * scale}px`,
            height: `${(useAiSprites ? 32 : 24) * scale}px`,
            ["--excavator-sheet-width" as string]: `${sheetScale * scale}px`,
            backgroundImage: `url('${getVehicleSpritePath("excavator")}')`,
            backgroundSize: `${sheetScale * scale}px ${(useAiSprites ? 32 : 24) * scale}px`,
          }}
        />
      ) : null}

      {showTruck ? (
        <div
          className="campus-dump-truck absolute"
          style={{
            top: `${paths.truck.y * scale * 0.01 * size}px`,
            left: 0,
            width: `${(useAiSprites ? 128 : 44) * scale}px`,
            height: `${(useAiSprites ? 32 : 22) * scale}px`,
            ["--truck-start" as string]: `${paths.truck.startX}%`,
            ["--truck-end" as string]: `${paths.truck.endX}%`,
            backgroundImage: `url('${getVehicleSpritePath("dump-truck")}')`,
            backgroundSize: `${(useAiSprites ? 512 : 176) * scale}px ${(useAiSprites ? 32 : 22) * scale}px`,
          }}
        />
      ) : null}

      {stage <= 3 ? (
        <div
          className="campus-dust absolute rounded-full bg-amber-200/30"
          style={{
            left: `${20 * scale}px`,
            bottom: `${8 * scale}px`,
            width: `${16 * scale}px`,
            height: `${8 * scale}px`,
          }}
        />
      ) : null}
    </div>
  );
}
