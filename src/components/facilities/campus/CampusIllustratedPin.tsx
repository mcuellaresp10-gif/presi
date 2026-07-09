"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CampusBuildingSprite } from "@/components/facilities/campus/CampusBuildingSprite";
import { ConstructionOverlay } from "@/components/facilities/campus/ConstructionOverlay";
import { ConstructionVehicleLayer } from "@/components/facilities/campus/ConstructionVehicleLayer";
import {
  getCampusAsset,
  CAMPUS_SLOT_CALIBRATION,
  hasAiVerifiedAssets,
  resolveCampusAssetSrc,
  shouldUseAiCampusArt,
} from "@/lib/game/campus-asset-manifest";
import {
  getConstructionStage,
  type CampusBuildingVariant,
  type CampusVisualTier,
  type ConstructionStage,
} from "@/lib/game/campus-visual-tiers";
import { cn } from "@/lib/utils";

export function CampusIllustratedPin({
  variant,
  tier,
  progress = 0,
  upgrading = false,
  isCompletePending = false,
  targetTier,
  selected = false,
  ready = false,
  size = 88,
  harmonizeFilter,
}: {
  variant: CampusBuildingVariant;
  tier: CampusVisualTier;
  progress?: number;
  upgrading?: boolean;
  isCompletePending?: boolean;
  targetTier?: CampusVisualTier;
  selected?: boolean;
  ready?: boolean;
  size?: number;
  harmonizeFilter?: string;
}) {
  const stage = getConstructionStage(progress) as ConstructionStage;
  const displayTier =
    upgrading && (isCompletePending || stage === 5)
      ? (targetTier ?? tier)
      : tier;

  const mode = upgrading && !isCompletePending ? "construction" : "idle";
  const assetStage = upgrading && !isCompletePending ? stage : undefined;
  const assetTier = mode === "idle" ? displayTier : undefined;

  const [visibleStage, setVisibleStage] = useState(assetStage ?? 1);
  const [crossfading, setCrossfading] = useState(false);

  useEffect(() => {
    if (mode !== "construction" || !assetStage) return;
    if (assetStage === visibleStage) return;
    setCrossfading(true);
    const timer = window.setTimeout(() => {
      setVisibleStage(assetStage);
      setCrossfading(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [assetStage, mode, visibleStage]);

  const assetQuery = {
    variant,
    mode,
    tier: assetTier,
    stage: mode === "construction" ? visibleStage : undefined,
  } as const;

  const useAiArt = shouldUseAiCampusArt(variant, mode);
  const resolvedSrc = useAiArt ? resolveCampusAssetSrc(assetQuery) : null;

  if (mode === "construction" && upgrading && !isCompletePending && !useAiArt) {
    return (
      <ConstructionOverlay
        variant={variant}
        progress={progress}
        isCompletePending={isCompletePending}
        targetTier={targetTier ?? tier}
        size={size}
      />
    );
  }

  if (!useAiArt || !resolvedSrc) {
    return (
      <CampusBuildingSprite
        variant={variant}
        tier={upgrading ? (targetTier ?? tier) : tier}
        selected={selected}
        ready={ready}
        size={size}
      />
    );
  }

  const { alt } = getCampusAsset(assetQuery);
  const slot = CAMPUS_SLOT_CALIBRATION[variant];
  const padScale = slot.padScale ?? 1;
  const padColor = slot.padColor ?? "rgba(26,51,40,0.9)";
  const rasterFilter = harmonizeFilter
    ? `${harmonizeFilter} var(--campus-raster-base-filter)`
    : "var(--campus-raster-base-filter)";

  return (
    <div
      className="campus-pin-slot relative overflow-visible"
      style={{ width: size, height: size }}
      data-campus-variant={variant}
      data-campus-mode={mode}
      data-campus-art="ia"
    >
      <div
        className="campus-ground-pad pointer-events-none absolute left-1/2 z-0 -translate-x-1/2"
        style={{
          bottom: size * 0.02,
          width: size * 0.92 * padScale,
          height: size * 0.38 * padScale,
          background: `radial-gradient(ellipse 100% 100% at 50% 55%, ${padColor} 0%, rgba(12,28,20,0.55) 55%, transparent 78%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[4%] left-1/2 z-[1] -translate-x-1/2 rounded-[100%] bg-[rgba(0,0,0,0.45)] blur-[4px]"
        style={{ width: size * 0.5 * padScale, height: size * 0.1 }}
        aria-hidden
      />

      {selected ? (
        <div
          className="pointer-events-none absolute inset-x-[6%] bottom-[2%] z-[2] rounded-[100%] border-2 border-cyan-400/80 shadow-[0_0_16px_rgba(34,211,238,0.45)]"
          style={{ height: size * 0.1 }}
          aria-hidden
        />
      ) : null}

      <div className="campus-raster-mask relative z-[3] h-full w-full">
        <Image
          src={`${resolvedSrc}?v=16`}
          alt={alt}
          width={512}
          height={512}
          className={cn(
            "campus-ia-raster h-full w-full object-contain object-bottom transition-opacity duration-[400ms]",
            crossfading ? "opacity-40" : "opacity-100",
            isCompletePending && "scale-105 transition-transform duration-500"
          )}
          style={{ filter: rasterFilter }}
          sizes={`${size}px`}
          priority={selected}
          unoptimized={resolvedSrc.endsWith(".png")}
        />
      </div>

      {upgrading && !isCompletePending && hasAiVerifiedAssets(variant) ? (
        <ConstructionVehicleLayer
          variant={variant}
          stage={visibleStage}
          size={size}
        />
      ) : null}
    </div>
  );
}

export function CampusIllustratedMini({
  variant,
  tier,
  progress,
  upgrading,
  isCompletePending,
  targetTier,
  size = 56,
}: {
  variant: CampusBuildingVariant;
  tier: CampusVisualTier;
  progress?: number;
  upgrading?: boolean;
  isCompletePending?: boolean;
  targetTier?: CampusVisualTier;
  size?: number;
}) {
  return (
    <CampusIllustratedPin
      variant={variant}
      tier={tier}
      progress={progress}
      upgrading={upgrading}
      isCompletePending={isCompletePending}
      targetTier={targetTier}
      size={size}
    />
  );
}
