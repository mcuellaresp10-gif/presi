import type { CampusBuildingVariant } from "@/lib/game/campus-visual-tiers";
import { CampusBuildingSprite } from "@/components/facilities/campus/CampusBuildingSprite";
import {
  getConstructionStage,
  type CampusVisualTier,
} from "@/lib/game/campus-visual-tiers";
import { cn } from "@/lib/utils";

function HazardTapePattern({ id }: { id: string }) {
  return (
    <defs>
      <pattern
        id={id}
        patternUnits="userSpaceOnUse"
        width="8"
        height="8"
        patternTransform="rotate(45)"
      >
        <rect width="4" height="8" fill="#fbbf24" />
        <rect x="4" width="4" height="8" fill="#1e293b" />
      </pattern>
    </defs>
  );
}

function StageOneTwoSvg({ patternId, showCrane }: { patternId: string; showCrane: boolean }) {
  const height = Math.round(88 * 0.82);
  return (
    <svg width={88} height={height} viewBox="0 0 88 72" aria-hidden>
      <HazardTapePattern id={patternId} />
      <rect x="8" y="44" width="72" height="20" fill="#5c4033" rx="2" />
      <rect
        x="8"
        y="44"
        width="72"
        height="20"
        fill={`url(#${patternId})`}
        opacity="0.35"
        rx="2"
      />
      <ellipse cx="28" cy="58" rx="10" ry="4" fill="#4a3728" />
      <ellipse cx="58" cy="56" rx="12" ry="5" fill="#4a3728" />
      {showCrane && (
        <g className="campus-crane-sway" style={{ transformOrigin: "60px 28px" }}>
          <rect x="56" y="20" width="6" height="36" fill="#fbbf24" />
          <rect x="40" y="18" width="30" height="4" fill="#f59e0b" />
          <rect x="28" y="36" width="4" height="16" fill="#a8a29e" />
          <rect x="56" y="36" width="4" height="16" fill="#a8a29e" />
          <rect x="28" y="36" width="32" height="3" fill="#d6d3d1" />
        </g>
      )}
    </svg>
  );
}

function ScaffoldSvg({ opacity }: { opacity: number }) {
  const height = Math.round(88 * 0.82);
  return (
    <svg
      width={88}
      height={height}
      viewBox="0 0 88 72"
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
      aria-hidden
    >
      <rect x="14" y="32" width="4" height="28" fill="#94a3b8" />
      <rect x="70" y="32" width="4" height="28" fill="#94a3b8" />
      <rect x="14" y="36" width="60" height="3" fill="#cbd5e0" />
      <rect x="14" y="48" width="60" height="3" fill="#cbd5e0" />
      <g className="campus-dust">
        <circle cx="30" cy="58" r="2" fill="#a8a29e" opacity="0.5" />
        <circle cx="50" cy="60" r="1.5" fill="#a8a29e" opacity="0.4" />
        <circle cx="62" cy="57" r="2" fill="#a8a29e" opacity="0.45" />
      </g>
    </svg>
  );
}

export function ConstructionOverlay({
  variant,
  progress,
  isCompletePending = false,
  targetTier = 2,
  size = 88,
}: {
  variant: CampusBuildingVariant;
  progress: number;
  isCompletePending?: boolean;
  targetTier?: CampusVisualTier;
  size?: number;
}) {
  const stage = getConstructionStage(progress);
  const patternId = `hazard-${variant}-${size}`;
  const height = Math.round(size * 0.82);

  if (isCompletePending || stage === 5) {
    return (
      <div className="relative" style={{ width: size, height }}>
        <CampusBuildingSprite
          variant={variant}
          tier={targetTier}
          size={size}
          ready
        />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-presi-gold text-[10px] font-bold text-presi-bg nav-glow">
          !
        </span>
      </div>
    );
  }

  if (stage <= 2) {
    return (
      <div style={{ width: size, height }}>
        <StageOneTwoSvg patternId={patternId} showCrane={stage === 2} />
      </div>
    );
  }

  const buildingTier: CampusVisualTier = stage === 3 ? 1 : targetTier;
  const scaffoldOpacity = stage === 3 ? 1 : 0.4;

  return (
    <div className="relative" style={{ width: size, height }}>
      <CampusBuildingSprite
        variant={variant}
        tier={buildingTier}
        size={size}
      />
      <ScaffoldSvg opacity={scaffoldOpacity} />
    </div>
  );
}

export function ConstructionOverlayMini({
  variant,
  progress,
  isCompletePending,
  targetTier,
}: {
  variant: CampusBuildingVariant;
  progress: number;
  isCompletePending?: boolean;
  targetTier?: CampusVisualTier;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/5 p-2",
        isCompletePending && "border-presi-gold/40 bg-presi-gold/10"
      )}
    >
      <ConstructionOverlay
        variant={variant}
        progress={progress}
        isCompletePending={isCompletePending}
        targetTier={targetTier}
        size={72}
      />
    </div>
  );
}
