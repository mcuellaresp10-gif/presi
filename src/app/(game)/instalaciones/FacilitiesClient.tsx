"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AcademyUIState } from "@/components/facilities/AcademyPackCard";
import {
  CampusBottomNav,
  CAMPUS_BUILDINGS,
  FacilitiesCampusMap,
} from "@/components/facilities/FacilitiesCampusMap";
import { FacilityDetailSheet } from "@/components/facilities/FacilityDetailSheet";
import { PassiveIncomeBanner } from "@/components/facilities/PassiveIncomeBanner";
import type { ScoutingUIState } from "@/components/scouting/ScoutingPackCard";
import { startFacilityUpgrade } from "@/lib/actions/facilities";
import { MAX_CONCURRENT_UPGRADES, getRemainingMs } from "@/lib/game";
import type { Facility, FacilityType } from "@/lib/game/types";

type UpgradeInfo = {
  cost: number;
  isMaxLevel: boolean;
  canAfford: boolean;
  buildHours: number;
};

export function FacilitiesClient({
  facilities,
  scoutingState,
  academyState,
  presupuesto,
  pendingIncome,
  pendingGems,
  pendingTicks,
  incomePerTick,
  gemsPerTick,
  incomeIntervalHours,
  nextIncomeTickAt,
  weeklyIncome,
  weeklyGems,
  activeUpgradesCount,
  upgradeInfo,
  wildCards = [],
  rosterPlayers = [],
}: {
  facilities: Facility[];
  scoutingState: ScoutingUIState;
  academyState: AcademyUIState;
  presupuesto: number;
  pendingIncome: number;
  pendingGems: number;
  pendingTicks: number;
  incomePerTick: number;
  gemsPerTick: number;
  incomeIntervalHours: number;
  nextIncomeTickAt: string;
  weeklyIncome: number;
  weeklyGems: number;
  activeUpgradesCount: number;
  upgradeInfo: Partial<Record<FacilityType, UpgradeInfo>>;
  wildCards?: import("@/lib/actions/wild-cards").WildCardInventoryItem[];
  rosterPlayers?: import("@/lib/game/types").Player[];
}) {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FacilityType | null>(null);

  const scoutingFacility = facilities.find((f) => f.tipo === "scouting");
  const academyFacility = facilities.find((f) => f.tipo === "academia");

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as FacilityType;
    if (CAMPUS_BUILDINGS.some((b) => b.tipo === hash)) {
      setSelected(hash);
    }
  }, []);

  useEffect(() => {
    const hasActive = facilities.some(
      (f) =>
        f.mejora_termina_en &&
        new Date(f.mejora_termina_en).getTime() > now
    );
    const packTimer =
      (scoutingState.estado === "timer" &&
        new Date(scoutingState.generaEn).getTime() > now) ||
      (academyState.estado === "timer" &&
        new Date(academyState.generaEn).getTime() > now);

    if (!hasActive && !packTimer) return;

    const poll = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(poll);
  }, [facilities, now, router, scoutingState, academyState]);

  function selectBuilding(tipo: FacilityType) {
    setSelected(tipo);
    window.history.replaceState(null, "", `#${tipo}`);
  }

  function closeSheet() {
    setSelected(null);
    window.history.replaceState(null, "", window.location.pathname);
  }

  async function handleUpgrade(tipo: FacilityType) {
    setLoading(tipo);
    setError(null);
    const result = await startFacilityUpgrade(tipo);

    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setLoading(null);
  }

  function getUpgradeRemaining(facility: Facility | undefined) {
    if (!facility?.mejora_termina_en) return 0;
    return getRemainingMs({
      ...facility,
      mejora_termina_en: facility.mejora_termina_en,
    });
  }

  const scoutingUpgrading =
    !!scoutingFacility?.mejora_termina_en &&
    new Date(scoutingFacility.mejora_termina_en).getTime() > now;
  const academyUpgrading =
    !!academyFacility?.mejora_termina_en &&
    new Date(academyFacility.mejora_termina_en).getTime() > now;

  const scoutingReady =
    scoutingState.estado === "listo" &&
    (!!scoutingState.player || !!scoutingState.wildCardType);
  const academyReady =
    academyState.estado === "listo" && !!academyState.player;

  const buildingStatus = useMemo(() => {
    const status = {} as Record<
      FacilityType,
      { nivel: number; upgrading: boolean; ready?: boolean }
    >;

    for (const b of CAMPUS_BUILDINGS) {
      const f = facilities.find((fac) => fac.tipo === b.tipo);
      status[b.tipo] = {
        nivel: f?.nivel ?? 1,
        upgrading: !!(
          f?.mejora_termina_en &&
          new Date(f.mejora_termina_en).getTime() > now
        ),
        ready:
          b.tipo === "scouting"
            ? scoutingReady
            : b.tipo === "academia"
              ? academyReady
              : undefined,
      };
    }
    return status;
  }, [facilities, scoutingReady, academyReady, now]);

  return (
    <>
      <div className="-mx-4 min-h-[calc(100vh-8rem)] bg-presi-bg px-3 pb-6 pt-2 text-white">
        <div className="mb-4">
          <h1 className="text-display text-xl text-presi-gold">Instalaciones</h1>
          <p className="text-xs text-white/50">
            Toca un edificio · Mejoras {activeUpgradesCount}/
            {MAX_CONCURRENT_UPGRADES}
          </p>
        </div>

        {error ? <p className="mb-2 text-sm text-presi-red">{error}</p> : null}

        <div className="mb-3">
          <PassiveIncomeBanner
            pendingAmount={pendingIncome}
            pendingGems={pendingGems}
            pendingTicks={pendingTicks}
            incomePerTick={incomePerTick}
            gemsPerTick={gemsPerTick}
            incomeIntervalHours={incomeIntervalHours}
            nextIncomeTickAt={nextIncomeTickAt}
            weeklyIncome={weeklyIncome}
            weeklyGems={weeklyGems}
          />
        </div>

        <FacilitiesCampusMap
          selected={selected}
          onSelect={selectBuilding}
          buildingStatus={buildingStatus}
        />

        <div className="mt-3">
          <CampusBottomNav selected={selected} onSelect={selectBuilding} />
        </div>

        <p className="mt-3 text-center text-[10px] text-white/40">
          Estadio · Sede deportiva · Oficinas · Médico · Gimnasio
        </p>
      </div>

      <FacilityDetailSheet
        open={!!selected}
        tipo={selected}
        facilities={facilities}
        scoutingState={scoutingState}
        academyState={academyState}
        loading={loading}
        presupuesto={presupuesto}
        upgradeInfo={upgradeInfo}
        onClose={closeSheet}
        onUpgrade={handleUpgrade}
        scoutingUpgrading={scoutingUpgrading}
        academyUpgrading={academyUpgrading}
        scoutingUpgradeRemaining={getUpgradeRemaining(scoutingFacility)}
        academyUpgradeRemaining={getUpgradeRemaining(academyFacility)}
        wildCards={wildCards}
        rosterPlayers={rosterPlayers}
      />
    </>
  );
}
