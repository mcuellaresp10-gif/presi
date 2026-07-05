"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerCard } from "@/components/cards/PlayerCard";
import { WildCardRewardCard } from "@/components/wild-cards/WildCardRewardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  claimScoutingPlayer,
  rejectScoutingPlayer,
} from "@/lib/actions/scouting";
import {
  formatRemainingTime,
  getScoutingDurationHours,
  getScoutingPremiumRarityPct,
} from "@/lib/game";
import type { WildCardType } from "@/lib/game/wild-cards";
import type { Player } from "@/lib/game/types";
import { formatCompactMoney } from "@/lib/utils";

export type ScoutingUIState = {
  estado: "timer" | "listo" | "reclamado";
  generaEn: string;
  player: Player | null;
  wildCardType: WildCardType | null;
  scoutingNivel: number;
  wildCardChancePct?: number;
  presupuesto: number;
};

export function ScoutingPackCard({
  state,
  compact = false,
  showUpgrade = false,
  onUpgrade,
  upgradeLoading = false,
  isUpgrading = false,
  upgradeRemaining = 0,
  upgradeCost = 0,
  isMaxLevel = false,
  canAffordUpgrade = true,
  upgradeBuildHours = 24,
}: {
  state: ScoutingUIState;
  compact?: boolean;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  upgradeLoading?: boolean;
  isUpgrading?: boolean;
  upgradeRemaining?: number;
  upgradeCost?: number;
  isMaxLevel?: boolean;
  canAffordUpgrade?: boolean;
  upgradeBuildHours?: number;
}) {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState<"claim" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = Math.max(
    0,
    new Date(state.generaEn).getTime() - now
  );
  const isWildCardReady = state.estado === "listo" && !!state.wildCardType;
  const isPlayerReady = state.estado === "listo" && !!state.player;
  const isReady = isWildCardReady || isPlayerReady;
  const durationHours = getScoutingDurationHours(state.scoutingNivel);
  const premiumPct = getScoutingPremiumRarityPct(state.scoutingNivel);
  const wildCardPct =
    state.wildCardChancePct ??
    Math.round((0.09 + 0.01) * 1000) / 10;

  useEffect(() => {
    if (isReady) return;
    if (remainingMs <= 0 && state.estado === "timer") {
      router.refresh();
    }
  }, [remainingMs, isReady, router, state.estado]);

  async function handleClaim() {
    setLoading("claim");
    setError(null);
    const result = await claimScoutingPlayer();
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    setError(null);
    const result = await rejectScoutingPlayer();
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <Card
      id="scouting"
      className={compact ? "border-presi-cyan/30 bg-presi-cyan/5" : ""}
    >
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span>🔍</span>
            Centro de scouting
          </span>
          <span className="rounded-full bg-presi-gold/15 px-2 py-0.5 text-xs font-medium text-presi-gold">
            Nv. {state.scoutingNivel}
          </span>
        </CardTitle>
        <p className="text-xs text-white/60">
          Timer ~{durationHours}h · ~{premiumPct}% oro/leyenda · ~{wildCardPct}% Wild Card
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isWildCardReady && state.wildCardType ? (
          <>
            <p className="text-center text-sm font-medium text-white">
              ¡Suerte! Wild Card en el sobre
            </p>
            <WildCardRewardCard cardType={state.wildCardType} />
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleClaim}
                disabled={loading !== null}
                className="w-full"
              >
                {loading === "claim" ? "..." : "Reclamar carta"}
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
        ) : isPlayerReady && state.player ? (
          <>
            <p className="text-center text-sm font-medium text-white">
              ¡Sobre listo! Ficha o rechaza al jugador
            </p>
            <PlayerCard player={state.player} />
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
            <p className="text-xs text-white/70">Próximo sobre en</p>
            <p className="font-mono text-2xl font-bold text-presi-cyan">
              {formatRemainingTime(remainingMs)}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-presi-red">{error}</p>}

        {showUpgrade && (
          <div className="border-t border-white/10 pt-3">
            {isUpgrading ? (
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-white/70">
                  Mejorando instalación...
                </p>
                <p className="font-mono text-lg font-bold text-presi-cyan">
                  {formatRemainingTime(upgradeRemaining)}
                </p>
              </div>
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
                      ? `Mejorar a nivel ${state.scoutingNivel + 1}`
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
