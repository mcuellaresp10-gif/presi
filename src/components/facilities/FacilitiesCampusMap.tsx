"use client";

import type { FacilityType } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export type CampusBuildingConfig = {
  tipo: FacilityType;
  label: string;
  shortLabel: string;
  x: number;
  y: number;
  variant: "stadium" | "academy" | "office" | "finance" | "medical" | "gym";
  scale?: number;
};

export const CAMPUS_BUILDINGS: CampusBuildingConfig[] = [
  {
    tipo: "hinchas",
    label: "Estadio",
    shortLabel: "Hinchas",
    x: 50,
    y: 30,
    variant: "stadium",
    scale: 1.15,
  },
  {
    tipo: "academia",
    label: "Sede deportiva",
    shortLabel: "Academia",
    x: 16,
    y: 54,
    variant: "academy",
    scale: 0.95,
  },
  {
    tipo: "scouting",
    label: "Oficina scouting",
    shortLabel: "Scouting",
    x: 76,
    y: 36,
    variant: "office",
    scale: 0.9,
  },
  {
    tipo: "oficina",
    label: "Zona financiera",
    shortLabel: "Oficina",
    x: 84,
    y: 58,
    variant: "finance",
    scale: 0.88,
  },
  {
    tipo: "cuerpo_medico",
    label: "Centro médico",
    shortLabel: "Médico",
    x: 66,
    y: 74,
    variant: "medical",
    scale: 0.9,
  },
  {
    tipo: "gimnasio",
    label: "Gimnasio",
    shortLabel: "Gimnasio",
    x: 30,
    y: 76,
    variant: "gym",
    scale: 0.85,
  },
];

function BuildingGraphic({
  variant,
  selected,
}: {
  variant: CampusBuildingConfig["variant"];
  selected: boolean;
}) {
  const glow = selected ? "drop-shadow(0 0 12px rgba(34,211,238,0.8))" : undefined;

  switch (variant) {
    case "stadium":
      return (
        <svg width="88" height="72" viewBox="0 0 88 72" style={{ filter: glow }}>
          <ellipse cx="44" cy="58" rx="40" ry="10" fill="#1a3d1a" opacity="0.5" />
          <path d="M12 48 L44 28 L76 48 L76 58 L12 58 Z" fill="#4a5568" />
          <path d="M18 48 L44 32 L70 48 L70 54 L18 54 Z" fill="#718096" />
          <ellipse cx="44" cy="50" rx="28" ry="14" fill="#2d6a4f" />
          <ellipse cx="44" cy="50" rx="22" ry="10" fill="#40916c" />
          <path d="M44 28 L44 22" stroke="#cbd5e0" strokeWidth="2" />
          <circle cx="44" cy="20" r="3" fill="#fbbf24" />
        </svg>
      );
    case "academy":
      return (
        <svg width="76" height="64" viewBox="0 0 76 64" style={{ filter: glow }}>
          <rect x="4" y="36" width="32" height="20" fill="#64748b" />
          <rect x="40" y="36" width="32" height="20" fill="#64748b" />
          <rect x="6" y="38" width="28" height="14" fill="#2d6a4f" rx="2" />
          <rect x="42" y="38" width="28" height="14" fill="#40916c" rx="2" />
          <rect x="28" y="24" width="20" height="16" fill="#94a3b8" />
          <polygon points="38,12 28,24 48,24" fill="#cbd5e0" />
        </svg>
      );
    case "office":
      return (
        <svg width="56" height="72" viewBox="0 0 56 72" style={{ filter: glow }}>
          <rect x="8" y="20" width="40" height="48" fill="#475569" />
          <rect x="12" y="24" width="32" height="40" fill="#64748b" />
          {[28, 36, 44, 52].map((y) => (
            <g key={y}>
              <rect x="16" y={y} width="8" height="6" fill="#93c5fd" opacity="0.8" />
              <rect x="28" y={y} width="8" height="6" fill="#93c5fd" opacity="0.8" />
            </g>
          ))}
          <rect x="20" y="8" width="16" height="14" fill="#334155" />
        </svg>
      );
    case "finance":
      return (
        <svg width="52" height="68" viewBox="0 0 52 68" style={{ filter: glow }}>
          <rect x="10" y="16" width="32" height="48" fill="#334155" />
          <rect x="14" y="20" width="24" height="40" fill="#475569" />
          <text x="26" y="44" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold">
            $
          </text>
          <rect x="18" y="6" width="16" height="12" fill="#1e293b" />
        </svg>
      );
    case "medical":
      return (
        <svg width="64" height="68" viewBox="0 0 64 68" style={{ filter: glow }}>
          <rect x="12" y="24" width="40" height="40" fill="#e2e8f0" />
          <rect x="16" y="28" width="32" height="32" fill="#f1f5f9" />
          <rect x="28" y="34" width="8" height="20" fill="#ef4444" />
          <rect x="22" y="40" width="20" height="8" fill="#ef4444" />
          <circle cx="48" cy="18" r="10" fill="#64748b" opacity="0.6" />
          <text x="48" y="22" textAnchor="middle" fill="white" fontSize="10">
            +
          </text>
        </svg>
      );
    case "gym":
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" style={{ filter: glow }}>
          <rect x="10" y="28" width="40" height="28" fill="#475569" />
          <rect x="14" y="32" width="32" height="20" fill="#64748b" />
          <rect x="4" y="36" width="8" height="4" fill="#94a3b8" rx="1" />
          <rect x="48" y="36" width="8" height="4" fill="#94a3b8" rx="1" />
          <rect x="22" y="38" width="16" height="4" fill="#cbd5e0" rx="1" />
          <polygon points="30,14 22,28 38,28" fill="#94a3b8" />
        </svg>
      );
  }
}

export function FacilitiesCampusMap({
  selected,
  onSelect,
  buildingStatus,
}: {
  selected: FacilityType | null;
  onSelect: (tipo: FacilityType) => void;
  buildingStatus: Record<
    FacilityType,
    { nivel: number; upgrading: boolean; ready?: boolean }
  >;
}) {
  return (
    <div className="facilities-campus relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10">
      <div className="absolute inset-0 facilities-campus-ground" />

      {/* Roads */}
      <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 55 L100 55" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        <path d="M35 0 L35 100" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <path d="M65 15 L65 100" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      </svg>

      {/* Buildings */}
      {CAMPUS_BUILDINGS.map((building) => {
        const status = buildingStatus[building.tipo];
        const isSelected = selected === building.tipo;

        return (
          <button
            key={building.tipo}
            type="button"
            onClick={() => onSelect(building.tipo)}
            className={cn(
              "absolute z-10 flex flex-col items-center transition-all duration-200",
              isSelected ? "z-20" : "hover:opacity-90"
            )}
            style={{
              left: `${building.x}%`,
              top: `${building.y}%`,
              transform: `translate(-50%, -50%) scale(${(building.scale ?? 1) * (isSelected ? 1.1 : 1)})`,
            }}
          >
            <BuildingGraphic variant={building.variant} selected={isSelected} />

            <div
              className={cn(
                "mt-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur",
                isSelected
                  ? "bg-cyan-400 text-white"
                  : "bg-black/60 text-white/90"
              )}
            >
              {building.shortLabel}
            </div>

            <span className="mt-0.5 rounded-full bg-presi-gold/90 px-1.5 text-[8px] font-bold text-white">
              Nv.{status?.nivel ?? 1}
            </span>

            {status?.upgrading && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-orange-400 ring-2 ring-orange-400/40" />
            )}
            {status?.ready && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-presi-cyan ring-2 ring-presi-cyan/40" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CampusBottomNav({
  selected,
  onSelect,
}: {
  selected: FacilityType | null;
  onSelect: (tipo: FacilityType) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-1 backdrop-blur">
      {CAMPUS_BUILDINGS.map((b) => (
        <button
          key={b.tipo}
          type="button"
          onClick={() => onSelect(b.tipo)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors",
            selected === b.tipo
              ? "bg-cyan-400 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          )}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
