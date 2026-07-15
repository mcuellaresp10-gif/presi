import type {
  CampusBuildingVariant,
  CampusVisualTier,
} from "@/lib/game/campus-visual-tiers";
import { cn } from "@/lib/utils";

function BuildingShadow() {
  return (
    <ellipse
      cx="44"
      cy="68"
      rx="36"
      ry="8"
      fill="#000"
      opacity="0.35"
    />
  );
}

function StadiumSprite({ tier }: { tier: CampusVisualTier }) {
  return (
    <g>
      <BuildingShadow />
      {/* Base platform */}
      <path d="M8 52 L44 36 L80 52 L80 58 L8 58 Z" fill="#3d4f5f" />
      <path d="M14 50 L44 38 L74 50 L74 54 L14 54 Z" fill="#4a6275" />
      {/* Field */}
      <ellipse cx="44" cy="50" rx="26" ry="12" fill="#2d6a4f" />
      <ellipse cx="44" cy="50" rx="20" ry="8" fill="#40916c" />
      {/* Stands back */}
      <path d="M16 48 L44 30 L72 48 L68 52 L20 52 Z" fill="#64748b" />
      {tier >= 2 && (
        <path d="M20 44 L44 28 L68 44 L64 48 L24 48 Z" fill="#94a3b8" />
      )}
      {tier >= 3 && (
        <>
          <rect x="40" y="14" width="8" height="16" fill="#cbd5e0" />
          <circle cx="44" cy="12" r="4" fill="#fbbf24" className="campus-flag-wave" />
          <rect x="38" y="8" width="12" height="3" fill="#fbbf24" opacity="0.8" />
          <circle cx="22" cy="40" r="2" fill="#fef08a" className="campus-light-pulse" />
          <circle cx="66" cy="40" r="2" fill="#fef08a" className="campus-light-pulse" />
        </>
      )}
      {tier === 1 && (
        <path d="M44 30 L44 24" stroke="#cbd5e0" strokeWidth="2" />
      )}
    </g>
  );
}

function AcademySprite({ tier }: { tier: CampusVisualTier }) {
  return (
    <g>
      <BuildingShadow />
      <path d="M6 48 L38 32 L70 48 L70 56 L6 56 Z" fill="#64748b" />
      <rect x="8" y="40" width="28" height="14" fill="#475569" />
      <rect x="40" y="40" width="28" height="14" fill="#475569" />
      <rect x="10" y="42" width="24" height="10" fill="#2d6a4f" rx="1" />
      <rect x="42" y="42" width="24" height="10" fill="#40916c" rx="1" />
      <rect x="30" y="28" width="16" height="14" fill="#94a3b8" />
      <polygon points="38,16 28,28 48,28" fill="#cbd5e0" />
      {tier >= 2 && (
        <circle
          cx="58"
          cy="22"
          r="5"
          fill="#f97316"
          className="campus-ball-bounce"
        />
      )}
      {tier >= 3 && (
        <>
          <rect x="4" y="36" width="6" height="10" fill="#94a3b8" />
          <rect x="66" y="36" width="6" height="10" fill="#94a3b8" />
          <path d="M0 52 L76 52" stroke="#47f5d7" strokeWidth="1" opacity="0.5" />
        </>
      )}
    </g>
  );
}

function OfficeSprite({ tier }: { tier: CampusVisualTier }) {
  return (
    <g>
      <BuildingShadow />
      <path d="M12 56 L44 40 L76 56 L76 64 L12 64 Z" fill="#334155" />
      <rect x="16" y="44" width="56" height="18" fill="#475569" />
      {[48, 54].map((y) => (
        <g key={y}>
          <rect x="22" y={y} width="10" height="6" fill="#93c5fd" opacity="0.85" />
          <rect x="38" y={y} width="10" height="6" fill="#93c5fd" opacity="0.85" />
          <rect x="54" y={y} width="10" height="6" fill="#93c5fd" opacity="0.85" />
        </g>
      ))}
      <rect x="28" y="28" width="32" height="16" fill="#1e293b" />
      {tier >= 2 && (
        <rect x="32" y="20" width="24" height="10" fill="#334155" />
      )}
      {tier >= 3 && (
        <>
          <rect x="36" y="12" width="16" height="10" fill="#475569" />
          <rect
            x="40"
            y="48"
            width="8"
            height="6"
            fill="#47f5d7"
            opacity="0.6"
            className="campus-window-glow"
          />
        </>
      )}
    </g>
  );
}

function FinanceSprite({ tier }: { tier: CampusVisualTier }) {
  return (
    <g>
      <BuildingShadow />
      <path d="M14 54 L44 38 L74 54 L74 62 L14 62 Z" fill="#1e293b" />
      <rect x="18" y="42" width="52" height="18" fill="#334155" />
      <text x="44" y="54" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold">
        $
      </text>
      {tier >= 2 && (
        <rect x="22" y="34" width="44" height="8" fill="#475569" />
      )}
      {tier >= 3 && (
        <>
          <rect x="26" y="26" width="36" height="8" fill="#64748b" />
          <rect x="30" y="18" width="28" height="8" fill="#94a3b8" />
        </>
      )}
    </g>
  );
}

function MedicalSprite({ tier }: { tier: CampusVisualTier }) {
  return (
    <g>
      <BuildingShadow />
      <path d="M10 54 L44 36 L78 54 L78 62 L10 62 Z" fill="#cbd5e1" />
      <rect x="16" y="44" width="56" height="16" fill="#f1f5f9" />
      <rect x="38" y="48" width="12" height="8" fill="#ef4444" />
      <rect x="34" y="52" width="20" height="4" fill="#ef4444" />
      {tier >= 2 && (
        <circle cx="62" cy="28" r="10" fill="#64748b" opacity="0.7" />
      )}
      {tier >= 3 && (
        <>
          <text x="62" y="32" textAnchor="middle" fill="white" fontSize="12">
            +
          </text>
          <rect x="20" y="38" width="8" height="6" fill="#93c5fd" opacity="0.6" />
          <rect x="60" y="38" width="8" height="6" fill="#93c5fd" opacity="0.6" />
        </>
      )}
    </g>
  );
}

function GymSprite({ tier }: { tier: CampusVisualTier }) {
  return (
    <g>
      <BuildingShadow />
      <path d="M12 52 L44 36 L76 52 L76 58 L12 58 Z" fill="#475569" />
      <rect x="16" y="44" width="56" height="12" fill="#64748b" />
      <rect x="4" y="46" width="10" height="4" fill="#94a3b8" rx="1" />
      <rect x="74" y="46" width="10" height="4" fill="#94a3b8" rx="1" />
      <rect x="34" y="48" width="20" height="4" fill="#cbd5e0" rx="1" />
      <polygon points="44,22 34,36 54,36" fill="#94a3b8" />
      {tier >= 2 && (
        <rect x="30" y="38" width="28" height="6" fill="#334155" />
      )}
      {tier >= 3 && (
        <>
          <rect x="26" y="32" width="36" height="6" fill="#475569" />
          <circle cx="44" cy="18" r="3" fill="#47f5d7" className="campus-light-pulse" />
        </>
      )}
    </g>
  );
}

const SPRITES: Record<
  CampusBuildingVariant,
  React.FC<{ tier: CampusVisualTier }>
> = {
  stadium: StadiumSprite,
  academy: AcademySprite,
  office: OfficeSprite,
  finance: FinanceSprite,
  medical: MedicalSprite,
  gym: GymSprite,
};

export function CampusBuildingSprite({
  variant,
  tier,
  selected = false,
  ready = false,
  size = 88,
}: {
  variant: CampusBuildingVariant;
  tier: CampusVisualTier;
  selected?: boolean;
  ready?: boolean;
  size?: number;
}) {
  const Sprite = SPRITES[variant];
  const height = Math.round(size * 0.82);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 88 72"
      className={cn(
        "transition-all duration-300",
        selected && "drop-shadow-[0_0_12px_rgba(71,245,215,0.8)]",
        ready && !selected && "drop-shadow-[0_0_10px_rgba(71,245,215,0.5)]"
      )}
      aria-hidden
    >
      <Sprite tier={tier} />
      {ready && (
        <circle
          cx="72"
          cy="12"
          r="6"
          fill="#47f5d7"
          className="animate-pulse"
          opacity="0.9"
        />
      )}
    </svg>
  );
}
