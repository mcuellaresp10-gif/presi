"use client";

import { useEffect } from "react";
import { CloseButton } from "@/components/ui/close-button";
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
import type { EscudoConfig, Facility, FacilityType, Player } from "@/lib/game/types";
import { cn } from "@/lib/utils";

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
  now,
  wildCards = [],
  rosterPlayers = [],
  escudoConfig = null,
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
  now?: number;
  wildCards?: WildCardInventoryItem[];
  rosterPlayers?: Player[];
  escudoConfig?: EscudoConfig | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !tipo) return null;

  const config = CAMPUS_BUILDINGS.find((b) => b.tipo === tipo);
  const facility = facilities.find((f) => f.tipo === tipo);
  const scoutingFacility = facilities.find((f) => f.tipo === "scouting");
  const academyFacility = facilities.find((f) => f.tipo === "academia");
  const info = upgradeInfo[tipo];

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute bottom-0 left-0 right-0 mx-auto flex max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))] w-full max-w-lg flex-col",
          "rounded-t-3xl border border-white/10 bg-presi-surface shadow-2xl safe-bottom"
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-presi-cyan/70">
              {config?.label ?? tipo}
            </p>
            <h2 className="text-lg font-bold text-white">
              {config?.shortLabel ?? tipo}
            </h2>
          </div>
          <CloseButton onClick={onClose} className="-mr-1" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="space-y-4 pb-2">
            {tipo === "scouting" && (
              <>
                <ScoutingPackCard
                  state={scoutingState}
                  escudoConfig={escudoConfig}
                  showUpgrade
                  onUpgrade={() => onUpgrade("scouting")}
                  upgradeLoading={loading === "scouting"}
                  isUpgrading={scoutingUpgrading}
                  upgradeRemaining={scoutingUpgradeRemaining}
                  mejoraIniciaEn={scoutingFacility?.mejora_inicia_en ?? null}
                  mejoraTerminaEn={scoutingFacility?.mejora_termina_en ?? null}
                  upgradeNow={now}
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
                      escudoConfig={escudoConfig}
                    />
                  </div>
                )}
              </>
            )}

            {tipo === "academia" && (
              <AcademyPackCard
                state={academyState}
                escudoConfig={escudoConfig}
                showUpgrade
                onUpgrade={() => onUpgrade("academia")}
                upgradeLoading={loading === "academia"}
                isUpgrading={academyUpgrading}
                upgradeRemaining={academyUpgradeRemaining}
                mejoraIniciaEn={academyFacility?.mejora_inicia_en ?? null}
                mejoraTerminaEn={academyFacility?.mejora_termina_en ?? null}
                upgradeNow={now}
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
                now={now}
              />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
