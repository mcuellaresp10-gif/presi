"use client";

import type { CampusBuildingConfig, CampusBuildingStatus } from "@/components/facilities/FacilitiesCampusMap";
import { CampusIllustratedPin } from "@/components/facilities/campus/CampusIllustratedPin";
import { ConstructionBillboard } from "@/components/facilities/campus/ConstructionBillboard";
import { CAMPUS_SLOT_CALIBRATION } from "@/lib/game/campus-asset-manifest";
import {
  getCampusBuildingScale,
  getCampusVisualTier,
  getTargetCampusVisualTier,
} from "@/lib/game/campus-visual-tiers";
import { formatRemainingTime } from "@/lib/game/facilities";
import { cn } from "@/lib/utils";

export function CampusBuildingPin({
  building,
  status,
  isSelected,
  onSelect,
}: {
  building: CampusBuildingConfig;
  status: CampusBuildingStatus;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const tier = getCampusVisualTier(status.nivel);
  const targetTier = status.targetLevel
    ? getCampusVisualTier(status.targetLevel)
    : getTargetCampusVisualTier(status.nivel);
  const calibration = CAMPUS_SLOT_CALIBRATION[building.variant];
  const tierScale = getCampusBuildingScale(status.nivel, 1);
  const slotScale = (building.scale ?? 1) * (calibration.scale ?? 1);
  const spriteSize = Math.round(110 * slotScale);
  const displayScale = tierScale * (isSelected ? 1.06 : 1);
  const upgrading = status.upgrading;
  const progress = status.progress ?? 0;

  const levelLabel =
    upgrading && status.targetLevel
      ? `Nv.${status.nivel}→${status.targetLevel}`
      : `Nv.${status.nivel}`;

  const ariaLabel = upgrading
    ? `${building.label} nivel ${status.nivel}, obra al ${Math.round(progress * 100)}%, ${
        status.isCompletePending
          ? "terminada"
          : `faltan ${formatRemainingTime(status.remainingMs ?? 0)}`
      }`
    : `${building.label} nivel ${status.nivel}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      className={cn(
        "group absolute z-10 flex flex-col items-center outline-none transition-[z-index] duration-200",
        "focus-visible:ring-2 focus-visible:ring-cyan-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        isSelected ? "z-20" : "hover:z-[15]"
      )}
      style={{
        left: `calc(${building.x}% + ${calibration.offsetX ?? 0}px)`,
        top: `calc(${building.y}% + ${calibration.offsetY ?? 0}px)`,
        transform: "translate(-50%, 0)",
      }}
    >
      <div
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 flex -translate-x-1/2 flex-col items-center gap-1"
      >
        <div
          className={cn(
            "whitespace-nowrap rounded-lg border px-2 py-1 text-[10px] font-bold tracking-wide shadow-lg backdrop-blur-md transition-all duration-200",
            isSelected
              ? "border-cyan-300/60 bg-cyan-500/90 text-white shadow-cyan-500/20"
              : upgrading
                ? "border-orange-400/50 bg-orange-950/85 text-orange-50"
                : "border-white/15 bg-black/70 text-white/95 group-hover:border-white/25 group-hover:bg-black/80"
          )}
        >
          <span>{building.shortLabel}</span>
          <span
            className={cn(
              "ml-1.5 inline-flex rounded-full px-1.5 py-px text-[8px] font-bold",
              upgrading ? "bg-orange-500 text-white" : "bg-presi-gold/90 text-black"
            )}
          >
            {levelLabel}
          </span>
          {status.ready && !upgrading ? (
            <span className="ml-1 text-presi-gold" aria-hidden>
              ✓
            </span>
          ) : null}
        </div>

        {upgrading && status.remainingMs !== undefined ? (
          <ConstructionBillboard
            progress={progress}
            remainingMs={status.remainingMs}
            isCompletePending={status.isCompletePending}
            inline
          />
        ) : null}
      </div>

      <div
        className="relative origin-bottom transition-transform duration-200 ease-out"
        style={{ transform: `scale(${displayScale})` }}
      >
        <CampusIllustratedPin
          variant={building.variant}
          tier={tier}
          progress={progress}
          upgrading={upgrading}
          isCompletePending={status.isCompletePending}
          targetTier={targetTier}
          selected={isSelected}
          ready={status.ready}
          size={spriteSize}
          harmonizeFilter={calibration.filter}
        />
      </div>
    </button>
  );
}
