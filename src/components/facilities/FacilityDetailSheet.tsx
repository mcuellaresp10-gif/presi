"use client";

import { X } from "lucide-react";
import { AcademyPackCard, type AcademyUIState } from "@/components/facilities/AcademyPackCard";
import { FacilityUpgradeCard } from "@/components/facilities/FacilityUpgradeCard";
import {
  CAMPUS_BUILDINGS,
} from "@/components/facilities/FacilitiesCampusMap";
import {
  ScoutingPackCard,
  type ScoutingUIState,
} from "@/components/scouting/ScoutingPackCard";
import { WildCardInventory } from "@/components/wild-cards/WildCardInventory";
import type { WildCardInventoryItem } from "@/lib/actions/wild-cards";
import type { Facility, FacilityType } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/game/types";

type UpgradeInfo = {
  cost: number;
  isMaxLevel: boolean;
  canAfford: boolean;
  buildHours: number;
};

export function FacilityDetailSheet({
  open,
  tipo,
  facilities,
  scoutingState,
  academyState,
  loading,
  presupuesto,
  upgradeInfo,
  onClose,
  onUpgrade,
  scoutingUpgrading,
  academyUpgrading,
  scoutingUpgradeRemaining,
  academyUpgradeRemaining,
  wildCards = [],
  rosterPlayers = [],
}: {
  open: boolean;
  tipo: FacilityType | null;
  facilities: Facility[];
  scoutingState: ScoutingUIState;
  academyState: AcademyUIState;
  loading: string | null;
  presupuesto: number;
  upgradeInfo: Partial<Record<FacilityType, UpgradeInfo>>;
  onClose: () => void;
  onUpgrade: (tipo: FacilityType) => void;
  scoutingUpgrading: boolean;
  academyUpgrading: boolean;
  scoutingUpgradeRemaining: number;
  academyUpgradeRemaining: number;
  wildCards?: WildCardInventoryItem[];
  rosterPlayers?: Player[];
}) {
  if (!open || !tipo) return null;

  const config = CAMPUS_BUILDINGS.find((b) => b.tipo === tipo);
  const facility = facilities.find((f) => f.tipo === tipo);
  const info = upgradeInfo[tipo];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl",
          "border border-white/10 bg-[#0c1424] shadow-2xl"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0c1424] px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300/70">
              {config?.label ?? tipo}
            </p>
            <h2 className="text-lg font-bold text-white">
              {config?.shortLabel ?? tipo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 text-white/70 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {tipo === "scouting" && (
            <>
              <ScoutingPackCard
                state={scoutingState}
                showUpgrade
                onUpgrade={() => onUpgrade("scouting")}
                upgradeLoading={loading === "scouting"}
                isUpgrading={scoutingUpgrading}
                upgradeRemaining={scoutingUpgradeRemaining}
                upgradeCost={info?.cost ?? 0}
                isMaxLevel={info?.isMaxLevel ?? false}
                canAffordUpgrade={info?.canAfford ?? false}
                upgradeBuildHours={info?.buildHours ?? 24}
              />
              {wildCards.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                    Tus Wild Cards
                  </p>
                  <WildCardInventory
                    cards={wildCards}
                    rosterPlayers={rosterPlayers}
                  />
                </div>
              )}
            </>
          )}

          {tipo === "academia" && (
            <AcademyPackCard
              state={academyState}
              showUpgrade
              onUpgrade={() => onUpgrade("academia")}
              upgradeLoading={loading === "academia"}
              isUpgrading={academyUpgrading}
              upgradeRemaining={academyUpgradeRemaining}
              upgradeCost={info?.cost ?? 0}
              isMaxLevel={info?.isMaxLevel ?? false}
              canAffordUpgrade={info?.canAfford ?? false}
              upgradeBuildHours={info?.buildHours ?? 24}
            />
          )}

          {tipo !== "scouting" && tipo !== "academia" && facility && (
            <FacilityUpgradeCard
              facility={facility}
              loading={loading === tipo}
              presupuesto={presupuesto}
              upgradeCost={info?.cost ?? 0}
              onUpgrade={onUpgrade}
            />
          )}
        </div>
      </div>
    </div>
  );
}
