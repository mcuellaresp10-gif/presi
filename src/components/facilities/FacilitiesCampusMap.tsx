"use client";

import Image from "next/image";
import { CampusBuildingPin } from "@/components/facilities/campus/CampusBuildingPin";
import { CampusEnvironment } from "@/components/facilities/campus/CampusEnvironment";
import { getCampusMasterBackground, hasAiMasterBackground } from "@/lib/game/campus-asset-manifest";
import type { CampusBuildingVariant } from "@/lib/game/campus-visual-tiers";
import type { FacilityType } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export type CampusBuildingConfig = {
  tipo: FacilityType;
  label: string;
  shortLabel: string;
  /** Ground anchor on map (percent of container) */
  x: number;
  y: number;
  variant: CampusBuildingVariant;
  scale?: number;
};

/**
 * Slots on the campus map (x/y = % of container; pin grows downward from y).
 * Spread as a 2×3 grid so large sprites (esp. stadium) don't overlap.
 */
export const CAMPUS_BUILDINGS: CampusBuildingConfig[] = [
  {
    tipo: "hinchas",
    label: "Estadio",
    shortLabel: "Estadio",
    x: 50,
    y: 22,
    variant: "stadium",
    scale: 0.78,
  },
  {
    tipo: "academia",
    label: "Sede deportiva",
    shortLabel: "Academia",
    x: 16,
    y: 24,
    variant: "academy",
    scale: 0.72,
  },
  {
    tipo: "scouting",
    label: "Oficina scouting",
    shortLabel: "Scouting",
    x: 84,
    y: 22,
    variant: "office",
    scale: 0.68,
  },
  {
    tipo: "oficina",
    label: "Zona financiera",
    shortLabel: "Oficina",
    x: 84,
    y: 78,
    variant: "finance",
    scale: 0.68,
  },
  {
    tipo: "cuerpo_medico",
    label: "Centro médico",
    shortLabel: "Médico",
    x: 50,
    y: 80,
    variant: "medical",
    scale: 0.68,
  },
  {
    tipo: "gimnasio",
    label: "Gimnasio",
    shortLabel: "Gimnasio",
    x: 16,
    y: 78,
    variant: "gym",
    scale: 0.66,
  },
];

export type CampusBuildingStatus = {
  nivel: number;
  upgrading: boolean;
  ready?: boolean;
  progress?: number;
  remainingMs?: number;
  isCompletePending?: boolean;
  targetLevel?: number;
  mejoraIniciaEn?: string | null;
  mejoraTerminaEn?: string | null;
};

export function FacilitiesCampusMap({
  selected,
  onSelect,
  buildingStatus,
}: {
  selected: FacilityType | null;
  onSelect: (tipo: FacilityType) => void;
  buildingStatus: Record<FacilityType, CampusBuildingStatus>;
}) {
  const richBackground = hasAiMasterBackground();
  const masterSrc = `${getCampusMasterBackground()}?v=4`;

  return (
    <div
      className="facilities-campus relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]"
      data-rich-bg={richBackground ? "true" : undefined}
      aria-label="Mapa del campus"
    >
      <div className="relative h-full w-full">
      <Image
        src={masterSrc}
        alt=""
        fill
        className={cn(
          "object-cover",
          richBackground ? "scale-[1.02] object-center" : "object-center"
        )}
        sizes="(max-width: 768px) 100vw, 600px"
        priority
        aria-hidden
      />
      {richBackground ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-900/10 via-emerald-950/25 to-slate-950/45"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_50%_42%,rgba(45,90,55,0.18),rgba(8,20,14,0.55)_70%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_90%_at_50%_50%,transparent_40%,rgba(0,0,0,0.35)_100%)]"
            aria-hidden
          />
        </>
      ) : null}
      <div
        className={cn(
          "absolute inset-0 facilities-campus-ground",
          richBackground ? "opacity-0" : "opacity-40"
        )}
      />
      <CampusEnvironment minimal={richBackground} />

      {/* Roads — ocultas si hay fondo master ilustrado */}
      <svg
        className={cn(
          "absolute inset-0 h-full w-full",
          richBackground ? "opacity-0" : "opacity-50"
        )}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 55 L100 55"
          stroke="rgba(180,160,120,0.35)"
          strokeWidth="4"
        />
        <path
          d="M0 55 L100 55"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2"
        />
        <path
          d="M35 0 L35 100"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2"
        />
        <path
          d="M65 15 L65 100"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2"
        />
      </svg>

      {CAMPUS_BUILDINGS.map((building) => (
        <CampusBuildingPin
          key={building.tipo}
          building={building}
          status={buildingStatus[building.tipo]}
          isSelected={selected === building.tipo}
          onSelect={() => onSelect(building.tipo)}
        />
      ))}
      </div>
    </div>
  );
}

export function CampusBottomNav({
  selected,
  onSelect,
  buildingStatus,
}: {
  selected: FacilityType | null;
  onSelect: (tipo: FacilityType) => void;
  buildingStatus?: Record<FacilityType, CampusBuildingStatus>;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-1 backdrop-blur">
      {CAMPUS_BUILDINGS.map((b) => {
        const status = buildingStatus?.[b.tipo];
        const upgrading = status?.upgrading;
        const progress = status?.progress ?? 0;

        return (
          <button
            key={b.tipo}
            type="button"
            onClick={() => onSelect(b.tipo)}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors",
              selected === b.tipo
                ? "bg-cyan-400 text-white"
                : upgrading
                  ? "bg-orange-500/20 text-orange-100"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {b.shortLabel}
            {upgrading ? (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10"
                aria-hidden
              >
                <span
                  className="block h-full bg-presi-gold transition-all duration-1000 ease-linear"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
