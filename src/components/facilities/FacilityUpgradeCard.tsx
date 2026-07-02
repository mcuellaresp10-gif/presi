"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getFacilityEffectDescription,
  getFacilityIcon,
  getFacilityLabel,
  getFacilityNextEffectDescription,
  getFacilityUpgradeBuildHours,
  getFacilityUpgradeCostLabel,
} from "@/lib/game/facility-meta";
import { formatRemainingTime, isMaxFacilityLevel } from "@/lib/game/facilities";
import type { Facility, FacilityType } from "@/lib/game/types";
import { formatCompactMoney } from "@/lib/utils";

export function FacilityUpgradeCard({
  facility,
  loading,
  presupuesto,
  upgradeCost,
  onUpgrade,
}: {
  facility: Facility;
  loading: boolean;
  presupuesto: number;
  upgradeCost: number;
  onUpgrade: (tipo: FacilityType) => void;
}) {
  const tipo = facility.tipo;
  const atMax = isMaxFacilityLevel(facility.nivel);
  const canAfford = presupuesto >= upgradeCost;
  const isUpgrading =
    facility.mejora_termina_en &&
    new Date(facility.mejora_termina_en).getTime() > Date.now();
  const remaining =
    isUpgrading && facility.mejora_termina_en
      ? Math.max(
          0,
          new Date(facility.mejora_termina_en).getTime() - Date.now()
        )
      : 0;
  const buildHours = getFacilityUpgradeBuildHours(facility.nivel);

  return (
    <Card className="border-white/10 bg-[#0c1424] text-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span>{getFacilityIcon(tipo)}</span>
            {getFacilityLabel(tipo)}
          </span>
          <span className="rounded-full bg-andes-gold/20 px-2 py-0.5 text-xs font-medium text-andes-gold">
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
          <p className="text-[10px] text-cyan-300/80">
            Siguiente: {getFacilityNextEffectDescription(tipo, facility.nivel + 1)}
          </p>
        )}

        {isUpgrading ? (
          <div className="rounded-lg bg-cyan-500/10 p-3 text-center">
            <p className="text-xs text-white/60">Mejorando...</p>
            <p className="font-mono text-lg font-bold text-cyan-300">
              {formatRemainingTime(remaining)}
            </p>
          </div>
        ) : atMax ? (
          <p className="rounded-lg bg-andes-gold/10 p-3 text-center text-xs text-andes-gold">
            Nivel máximo alcanzado
          </p>
        ) : (
          <div className="space-y-2">
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
