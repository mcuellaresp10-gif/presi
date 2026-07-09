"use client";

import { FacilityUpgradeProgress } from "@/components/facilities/FacilityUpgradeProgress";
import { CAMPUS_BUILDINGS } from "@/components/facilities/FacilitiesCampusMap";
import { MAX_CONCURRENT_UPGRADES } from "@/lib/game";
import type { Facility, FacilityType } from "@/lib/game/types";

export function ActiveUpgradesDock({
  facilities,
  activeUpgradesCount,
  now,
  onSelect,
}: {
  facilities: Facility[];
  activeUpgradesCount: number;
  now: number;
  onSelect: (tipo: FacilityType) => void;
}) {
  if (activeUpgradesCount <= 0) return null;

  const upgrading = CAMPUS_BUILDINGS.map((b) => {
    const facility = facilities.find((f) => f.tipo === b.tipo);
    if (!facility?.mejora_termina_en) return null;
    return { building: b, facility };
  }).filter(Boolean) as Array<{
    building: (typeof CAMPUS_BUILDINGS)[number];
    facility: Facility;
  }>;

  const slotsFree = MAX_CONCURRENT_UPGRADES - activeUpgradesCount;

  return (
    <div className="mb-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-orange-100">
          Obras activas {activeUpgradesCount}/{MAX_CONCURRENT_UPGRADES}
        </p>
        {slotsFree > 0 ? (
          <p className="text-[10px] text-presi-cyan">
            {slotsFree} mejora{slotsFree !== 1 ? "s" : ""} disponible
            {slotsFree !== 1 ? "s" : ""}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {upgrading.map(({ building, facility }) => (
          <button
            key={building.tipo}
            type="button"
            onClick={() => onSelect(building.tipo)}
            className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5 text-left transition-colors hover:bg-black/30"
          >
            <FacilityUpgradeProgress
              tipo={building.tipo}
              nivel={facility.nivel}
              mejoraIniciaEn={facility.mejora_inicia_en}
              mejoraTerminaEn={facility.mejora_termina_en}
              variant="dock"
              now={now}
              shortLabel={building.shortLabel}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
