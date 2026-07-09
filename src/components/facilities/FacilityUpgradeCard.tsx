"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampusIllustratedMini } from "@/components/facilities/campus/CampusIllustratedPin";
import { FacilityUpgradeProgress } from "@/components/facilities/FacilityUpgradeProgress";
import {
  getCampusVisualTier,
  getCampusVisualTierLabel,
  getFacilityCampusVariant,
  getFacilityUpgradeProgress,
  getTargetCampusVisualTier,
} from "@/lib/game";
import {
  getFacilityEffectDescription,
  getFacilityIcon,
  getFacilityLabel,
  getFacilityNextEffectDescription,
  getFacilityUpgradeBuildHours,
  getFacilityUpgradeCostLabel,
} from "@/lib/game/facility-meta";
import { isMaxFacilityLevel } from "@/lib/game/facilities";
import type { Facility, FacilityType } from "@/lib/game/types";
import { formatCompactMoney } from "@/lib/utils";

export function FacilityUpgradeCard({
  facility,
  loading,
  presupuesto,
  upgradeCost,
  onUpgrade,
  now,
}: {
  facility: Facility;
  loading: boolean;
  presupuesto: number;
  upgradeCost: number;
  onUpgrade: (tipo: FacilityType) => void;
  now?: number;
}) {
  const tipo = facility.tipo;
  const atMax = isMaxFacilityLevel(facility.nivel);
  const canAfford = presupuesto >= upgradeCost;
  const isUpgrading =
    facility.mejora_termina_en &&
    new Date(facility.mejora_termina_en).getTime() > (now ?? Date.now());
  const isUpgradePending =
    facility.mejora_termina_en &&
    new Date(facility.mejora_termina_en).getTime() <= (now ?? Date.now());
  const showUpgradeProgress = isUpgrading || isUpgradePending;
  const buildHours = getFacilityUpgradeBuildHours(facility.nivel);
  const variant = getFacilityCampusVariant(tipo);
  const currentTier = getCampusVisualTier(facility.nivel);
  const nextTier = getTargetCampusVisualTier(facility.nivel);
  const nextTierLabel = getCampusVisualTierLabel(facility.nivel + 1);
  const upgradeState = getFacilityUpgradeProgress(facility, now ?? Date.now());

  return (
    <Card className="border-white/10 bg-presi-surface text-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span>{getFacilityIcon(tipo)}</span>
            {getFacilityLabel(tipo)}
          </span>
          <span className="rounded-full bg-presi-gold/20 px-2 py-0.5 text-xs font-medium text-presi-gold">
            Nv. {facility.nivel}
            {atMax ? " · MAX" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-white/70">
          {getFacilityEffectDescription(tipo, facility.nivel)}
        </p>
        {!atMax && (
          <p className="text-[10px] text-presi-cyan/80">
            Siguiente: {getFacilityNextEffectDescription(tipo, facility.nivel + 1)}
          </p>
        )}

        {showUpgradeProgress ? (
          <div className="space-y-3">
            {upgradeState ? (
              <div className="flex justify-center rounded-lg bg-white/5 py-3">
                <CampusIllustratedMini
                  variant={variant}
                  tier={currentTier}
                  progress={upgradeState.progress}
                  upgrading
                  isCompletePending={upgradeState.isCompletePending}
                  targetTier={nextTier}
                  size={72}
                />
              </div>
            ) : null}
            <FacilityUpgradeProgress
              tipo={tipo}
              nivel={facility.nivel}
              mejoraIniciaEn={facility.mejora_inicia_en}
              mejoraTerminaEn={facility.mejora_termina_en}
              variant="card"
              now={now}
              buildHours={buildHours}
            />
          </div>
        ) : atMax ? (
          <p className="rounded-lg bg-presi-gold/10 p-3 text-center text-xs text-presi-gold">
            Nivel máximo alcanzado
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3 rounded-lg bg-white/5 py-3">
              <CampusIllustratedMini variant={variant} tier={currentTier} size={56} />
              <span className="text-lg text-white/40">→</span>
              <CampusIllustratedMini variant={variant} tier={nextTier} size={56} />
            </div>
            <p className="text-center text-[10px] text-presi-cyan/70">
              Pasará a tier {nextTierLabel} al completar la obra
            </p>
            <p className="text-center text-[10px] text-white/50">
              Costo: {getFacilityUpgradeCostLabel(tipo, facility.nivel)} · Construcción ~{Math.round(buildHours)}h
            </p>
            <Button
              variant="secondary"
              className="w-full border-white/10 bg-white/10 text-white hover:bg-white/20"
              disabled={loading || !canAfford}
              onClick={() => onUpgrade(tipo)}
            >
              {loading
                ? "Iniciando..."
                : canAfford
                  ? `Mejorar a nv. ${facility.nivel + 1}`
                  : "Presupuesto insuficiente"}
            </Button>
            {!canAfford && (
              <p className="text-center text-[10px] text-red-300/80">
                Necesitas {formatCompactMoney(upgradeCost)} (tienes {formatCompactMoney(presupuesto)})
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
