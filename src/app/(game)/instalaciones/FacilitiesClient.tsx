"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AcademyUIState } from "@/components/facilities/AcademyPackCard";
import {
  CampusBottomNav,
  CAMPUS_BUILDINGS,
  FacilitiesCampusMap,
  type CampusBuildingStatus,
} from "@/components/facilities/FacilitiesCampusMap";
import { ActiveUpgradesDock } from "@/components/facilities/ActiveUpgradesDock";
import { FacilityDetailSheet } from "@/components/facilities/FacilityDetailSheet";
import { PassiveIncomeBanner } from "@/components/facilities/PassiveIncomeBanner";
import type { ScoutingUIState } from "@/components/scouting/ScoutingPackCard";
import { startFacilityUpgrade } from "@/lib/actions/facilities";
import { prepareScoutingReward } from "@/lib/actions/scouting";
import {
  MAX_CONCURRENT_UPGRADES,
  getFacilityUpgradeProgress,
  getRemainingMs,
} from "@/lib/game";
import type { Facility, FacilityType } from "@/lib/game/types";
import { HelpTip } from "@/components/help/HelpTip";
import { emitWalletUpdate } from "@/lib/wallet-events";

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
  upgradeInfo,
  wildCards = [],
  rosterPlayers = [],
  escudoConfig = null,
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
  escudoConfig?: import("@/lib/game/types").EscudoConfig | null;
}) {
  const router = useRouter();
  const refreshedUpgradesRef = useRef<Set<string>>(new Set());
  const preparingScoutRef = useRef(false);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FacilityType | null>(null);
  const [localScouting, setLocalScouting] = useState(scoutingState);

  const scoutingFacility = facilities.find((f) => f.tipo === "scouting");
  const academyFacility = facilities.find((f) => f.tipo === "academia");

  useEffect(() => {
    setLocalScouting(scoutingState);
  }, [scoutingState]);

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
    for (const facility of facilities) {
      if (!facility.mejora_termina_en) continue;
      const key = `${facility.tipo}-${facility.mejora_termina_en}`;
      const end = new Date(facility.mejora_termina_en).getTime();
      if (end <= now && !refreshedUpgradesRef.current.has(key)) {
        refreshedUpgradesRef.current.add(key);
        router.refresh();
      }
      if (!facility.mejora_termina_en) {
        refreshedUpgradesRef.current.delete(key);
      }
    }
  }, [facilities, now, router]);

  const prepareScout = useCallback(async () => {
    if (preparingScoutRef.current) return;
    preparingScoutRef.current = true;
    try {
      const result = await prepareScoutingReward();
      if ("success" in result && result.success) {
        setLocalScouting((prev) => ({
          ...prev,
          estado: result.estado,
          generaEn: result.generaEn,
          player: result.player,
          wildCardType: result.wildCardType,
          scoutingNivel: result.scoutingNivel,
          wildCardChancePct: result.wildCardChancePct,
          presupuesto: result.presupuesto,
        }));
      }
    } finally {
      preparingScoutRef.current = false;
    }
  }, []);

  useEffect(() => {
    const hasTimedUpgrade = facilities.some((f) => {
      if (!f.mejora_termina_en) return false;
      const end = new Date(f.mejora_termina_en).getTime();
      return end > now;
    });

    const academyTimer =
      academyState.estado === "timer" &&
      new Date(academyState.generaEn).getTime() > now;

    if (!hasTimedUpgrade && !academyTimer) return;

    const poll = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(poll);
  }, [facilities, now, router, academyState]);

  useEffect(() => {
    if (localScouting.estado !== "timer") return;
    if (new Date(localScouting.generaEn).getTime() > now) return;
    void prepareScout();
  }, [localScouting.estado, localScouting.generaEn, now, prepareScout]);

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

  function handleScoutClaimed(payload: {
    presupuesto?: number;
    generaEn?: string;
  }) {
    if (typeof payload.presupuesto === "number") {
      emitWalletUpdate({ presupuesto: payload.presupuesto });
    }
    setLocalScouting((prev) => ({
      ...prev,
      estado: "timer",
      generaEn: payload.generaEn ?? prev.generaEn,
      player: null,
      wildCardType: null,
      presupuesto:
        typeof payload.presupuesto === "number"
          ? payload.presupuesto
          : prev.presupuesto,
    }));
  }

  function handleScoutRejected(payload: { generaEn?: string }) {
    setLocalScouting((prev) => ({
      ...prev,
      estado: "timer",
      generaEn: payload.generaEn ?? prev.generaEn,
      player: null,
      wildCardType: null,
    }));
  }

  function getUpgradeRemaining(facility: Facility | undefined) {
    if (!facility?.mejora_termina_en) return 0;
    return getRemainingMs({
      ...facility,
      mejora_termina_en: facility.mejora_termina_en,
    });
  }

  const scoutingUpgradeProgress = scoutingFacility
    ? getFacilityUpgradeProgress(scoutingFacility, now)
    : null;
  const academyUpgradeProgress = academyFacility
    ? getFacilityUpgradeProgress(academyFacility, now)
    : null;
  const scoutingUpgrading = !!scoutingUpgradeProgress;
  const academyUpgrading = !!academyUpgradeProgress;

  const scoutingReady =
    localScouting.estado === "listo" &&
    (!!localScouting.player || !!localScouting.wildCardType);
  const academyReady =
    academyState.estado === "listo" && !!academyState.player;

  const buildingStatus = useMemo(() => {
    const status = {} as Record<FacilityType, CampusBuildingStatus>;

    for (const b of CAMPUS_BUILDINGS) {
      const f = facilities.find((fac) => fac.tipo === b.tipo);
      const upgradeProgress = f
        ? getFacilityUpgradeProgress(f, now)
        : null;
      const upgrading = !!upgradeProgress;

      status[b.tipo] = {
        nivel: f?.nivel ?? 1,
        upgrading,
        ready:
          b.tipo === "scouting"
            ? scoutingReady
            : b.tipo === "academia"
              ? academyReady
              : undefined,
        progress: upgradeProgress?.progress,
        remainingMs: upgradeProgress?.remainingMs,
        isCompletePending: upgradeProgress?.isCompletePending,
        targetLevel: upgradeProgress?.targetLevel,
        mejoraIniciaEn: f?.mejora_inicia_en ?? null,
        mejoraTerminaEn: f?.mejora_termina_en ?? null,
      };
    }
    return status;
  }, [facilities, scoutingReady, academyReady, now]);

  const activeUpgradesDisplayCount = useMemo(
    () =>
      facilities.filter((f) =>
        getFacilityUpgradeProgress(f, now)
      ).length,
    [facilities, now]
  );

  return (
    <>
      <div className="-mx-4 min-h-[calc(100vh-8rem)] px-3 pb-6 pt-2 text-white">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-display text-xl text-presi-gold">
              Instalaciones
            </h1>
            <HelpTip sectionId="instalaciones" />
            <HelpTip sectionId="scouting" label="Ayuda: Scouting" />
          </div>
          <p className="text-xs text-white/50">
            Toca un edificio para ver detalles y mejorar · Mejoras{" "}
            {activeUpgradesDisplayCount}/{MAX_CONCURRENT_UPGRADES}
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

        <ActiveUpgradesDock
          facilities={facilities}
          activeUpgradesCount={activeUpgradesDisplayCount}
          now={now}
          onSelect={selectBuilding}
        />

        <FacilitiesCampusMap
          selected={selected}
          onSelect={selectBuilding}
          buildingStatus={buildingStatus}
        />

        <div className="mt-3">
          <CampusBottomNav
            selected={selected}
            onSelect={selectBuilding}
            buildingStatus={buildingStatus}
          />
        </div>

        <p className="mt-3 text-center text-[10px] text-white/40">
          Estadio · Academia · Scouting · Oficina · Médico · Gimnasio
        </p>
      </div>

      <FacilityDetailSheet
        open={!!selected}
        tipo={selected}
        facilities={facilities}
        scoutingState={localScouting}
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
        now={now}
        wildCards={wildCards}
        rosterPlayers={rosterPlayers}
        escudoConfig={escudoConfig}
        onScoutingPrepare={prepareScout}
        onScoutingClaimed={handleScoutClaimed}
        onScoutingRejected={handleScoutRejected}
      />
    </>
  );
}
