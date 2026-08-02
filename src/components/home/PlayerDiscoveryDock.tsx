"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ScoutingPackPin } from "@/components/home/ScoutingPackPin";
import {
  ScoutingPackCard,
  type ScoutingUIState,
} from "@/components/scouting/ScoutingPackCard";
import { CloseButton } from "@/components/ui/close-button";
import { prepareScoutingReward } from "@/lib/actions/scouting";
import type { EscudoConfig } from "@/lib/game/types";
import {
  scoutingDockBottom,
  Z_SCOUTING_DOCK,
} from "@/lib/layout/bottom-dock";
import { emitWalletUpdate } from "@/lib/wallet-events";

export function PlayerDiscoveryDock({
  state,
  escudoConfig = null,
}: {
  state: ScoutingUIState;
  escudoConfig?: EscudoConfig | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [localState, setLocalState] = useState(state);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const preparingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalState(state);
  }, [state]);

  const prepareReward = useCallback(async () => {
    if (preparingRef.current) return;
    preparingRef.current = true;
    setPreparing(true);
    try {
      const result = await prepareScoutingReward();
      if ("error" in result && result.error) return;
      if (!("success" in result) || !result.success) return;

      setLocalState((prev) => ({
        ...prev,
        estado: result.estado,
        generaEn: result.generaEn,
        player: result.player,
        wildCardType: result.wildCardType,
        scoutingNivel: result.scoutingNivel,
        wildCardChancePct: result.wildCardChancePct,
        presupuesto: result.presupuesto,
      }));
    } finally {
      preparingRef.current = false;
      setPreparing(false);
    }
  }, []);

  function handleClaimed(payload: {
    presupuesto?: number;
    generaEn?: string;
  }) {
    if (typeof payload.presupuesto === "number") {
      emitWalletUpdate({ presupuesto: payload.presupuesto });
    }
    setLocalState((prev) => ({
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
    setSheetOpen(false);
  }

  function handleRejected(payload: { generaEn?: string }) {
    setLocalState((prev) => ({
      ...prev,
      estado: "timer",
      generaEn: payload.generaEn ?? prev.generaEn,
      player: null,
      wildCardType: null,
    }));
    setSheetOpen(false);
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-x-0 px-4"
        style={{ bottom: scoutingDockBottom, zIndex: Z_SCOUTING_DOCK }}
      >
        <div className="mx-auto max-w-lg">
          <ScoutingPackPin
            state={localState}
            preparing={preparing}
            onOpenReady={() => setSheetOpen(true)}
            onTimerExpired={() => void prepareReward()}
          />
        </div>
      </div>

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
          style={{ zIndex: Z_SCOUTING_DOCK + 20 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative z-10 m-4 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-presi-gold/30 bg-presi-surface p-3 shadow-2xl">
            <div className="mb-2 flex justify-end">
              <CloseButton onClick={() => setSheetOpen(false)} />
            </div>
            <ScoutingPackCard
              state={localState}
              escudoConfig={escudoConfig}
              compact
              autoRefresh={false}
              onPrepareNeeded={prepareReward}
              onClaimed={handleClaimed}
              onRejected={handleRejected}
            />
          </div>
        </div>
      ) : null}
    </>,
    document.body
  );
}
