"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerCard } from "@/components/cards/PlayerCard";
import { FacilityUpgradeProgress } from "@/components/facilities/FacilityUpgradeProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  claimAcademyPlayer,
  rejectAcademyPlayer,
} from "@/lib/actions/academy";
import { formatRemainingTime, getAcademyDurationHours } from "@/lib/game";
import type { EscudoConfig, Player } from "@/lib/game/types";
import { formatCompactMoney } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export type AcademyUIState = {
  estado: "timer" | "listo" | "reclamado";
  generaEn: string;
  player: Player | null;
  academyNivel: number;
  presupuesto: number;
};

export function AcademyPackCard({
  state,
  escudoConfig = null,
  showUpgrade = false,
  onUpgrade,
  upgradeLoading = false,
  isUpgrading = false,
  mejoraIniciaEn = null,
  mejoraTerminaEn = null,
  upgradeNow,
  upgradeCost = 0,
  isMaxLevel = false,
  canAffordUpgrade = true,
  upgradeBuildHours = 24,
}: {
  state: AcademyUIState;
  escudoConfig?: EscudoConfig | null;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  upgradeLoading?: boolean;
  isUpgrading?: boolean;
  upgradeRemaining?: number;
  mejoraIniciaEn?: string | null;
  mejoraTerminaEn?: string | null;
  upgradeNow?: number;
  upgradeCost?: number;
  isMaxLevel?: boolean;
  canAffordUpgrade?: boolean;
  upgradeBuildHours?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState<"claim" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = Math.max(0, new Date(state.generaEn).getTime() - now);
  const isReady = state.estado === "listo" && state.player;
  const durationHours = getAcademyDurationHours(state.academyNivel);

  useEffect(() => {
    if (isReady) return;
    if (remainingMs <= 0 && state.estado === "timer") {
      router.refresh();
    }
  }, [remainingMs, isReady, router, state.estado]);

  async function handleClaim() {
    setLoading("claim");
    setError(null);
    const result = await claimAcademyPlayer();
    if ("error" in result && result.error) {
      setError(result.error);
      toast({ title: "Error", description: result.error });
    } else {
      router.refresh();
    }
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    setError(null);
    const result = await rejectAcademyPlayer();
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <Card id="academia" className="border-presi-cyan/20 bg-presi-cyan/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span>🎓</span>
            Academia juvenil
          </span>
          <span className="rounded-full bg-presi-gold/15 px-2 py-0.5 text-xs font-medium text-presi-gold">
            Nv. {state.academyNivel}
          </span>
        </CardTitle>
        <p className="text-xs text-white/60">
          Promesa cada ~{durationHours}h · bronce/plata
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isReady && state.player ? (
          <>
            <p className="text-center text-sm font-medium text-white">
              ¡Promesa lista! Ficha o rechaza al juvenil
            </p>
            <PlayerCard player={state.player} escudoConfig={escudoConfig} />
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleClaim}
                disabled={loading !== null}
                className="w-full"
              >
                {loading === "claim" ? "Fichando..." : "Fichar"}
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={loading !== null}
                className="w-full"
              >
                {loading === "reject" ? "..." : "Rechazar"}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-presi-cyan/10 p-4 text-center">
            <p className="text-xs text-white/70">Próxima promesa en</p>
            <p className="font-mono text-2xl font-bold text-presi-cyan">
              {formatRemainingTime(remainingMs)}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-presi-red">{error}</p>}

        {showUpgrade && (
          <div className="border-t border-white/10 pt-3">
            {isUpgrading || mejoraTerminaEn ? (
              <FacilityUpgradeProgress
                tipo="academia"
                nivel={state.academyNivel}
                mejoraIniciaEn={mejoraIniciaEn}
                mejoraTerminaEn={mejoraTerminaEn}
                variant="card"
                now={upgradeNow}
                buildHours={upgradeBuildHours}
              />
            ) : isMaxLevel ? (
              <p className="rounded-lg bg-presi-gold/10 p-3 text-center text-xs text-white/70">
                Nivel máximo (10)
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-[10px] text-white/50">
                  Costo {formatCompactMoney(upgradeCost)} · ~{Math.round(upgradeBuildHours)}h construcción
                </p>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={upgradeLoading || !canAffordUpgrade}
                  onClick={onUpgrade}
                >
                  {upgradeLoading
                    ? "Iniciando..."
                    : canAffordUpgrade
                      ? `Mejorar a nivel ${state.academyNivel + 1}`
                      : "Presupuesto insuficiente"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
