"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PackCompleteMessage,
  PackOpenAnimation,
} from "@/components/packs/PackOpenAnimation";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { Skeleton } from "@/components/ui/skeleton";
import { openWelcomePack, selectPackPlayer } from "@/lib/actions/packs";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { normalizeEscudoConfig } from "@/lib/game/escudo-sanitize";
import type { EscudoConfig, Player } from "@/lib/game/types";

export function SobresClient({
  sobresRestantes,
  clubNombre,
  escudoConfig,
}: {
  sobresRestantes: number;
  clubNombre?: string;
  escudoConfig?: EscudoConfig;
}) {
  const router = useRouter();
  const [packNumber, setPackNumber] = useState(5 - sobresRestantes);
  const [options, setOptions] = useState<Player[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const loadPack = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await openWelcomePack();

    if ("error" in result && result.error) {
      if (result.error === "No te quedan sobres.") {
        setCompleted(true);
        setLoading(false);
        return;
      }
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("options" in result && result.options) {
      setPackNumber(result.packNumber ?? 1);
      setOptions(result.options);
      setSessionId(result.sessionId ?? null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadPack();
  }, [loadPack]);

  async function handleSelect(playerId: string) {
    if (!sessionId) return;
    setSelecting(true);
    setError(null);

    const result = await selectPackPlayer(sessionId, playerId);

    if ("error" in result && result.error) {
      setError(result.error);
      setSelecting(false);
      return;
    }

    if (result.onboardingDone) {
      setCompleted(true);
      setSelecting(false);
      router.refresh();
      return;
    }

    setSessionId(null);
    setOptions([]);
    setSelecting(false);
    await loadPack();
  }

  if (loading) {
    return (
      <div className="space-y-4 px-2">
        <OnboardingStepper current={3} />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-8 w-48 mx-auto" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-4">
        <OnboardingStepper current={3} />
        <PackCompleteMessage />
      </div>
    );
  }

  const totalPacks = 4;
  const currentPack = Math.min(packNumber, totalPacks);

  return (
    <div className="poster-bg poster-shards fixed inset-0 top-[52px] z-30 flex flex-col pb-8">
      <div className="relative z-10 px-4 pt-4">
        <OnboardingStepper current={3} />
        {clubNombre && escudoConfig ? (
          <div className="mt-4 flex items-center justify-center gap-3">
            <EscudoRenderer
              config={normalizeEscudoConfig(escudoConfig)}
              size={40}
            />
            <p className="text-sm font-bold text-presi-gold">{clubNombre}</p>
          </div>
        ) : null}
        <div className="mt-4 text-center">
          <p className="text-display text-2xl text-presi-gold">
            Sobre {currentPack} de {totalPacks}
          </p>
          <p className="mt-1 text-sm text-white/50">
            Elige 1 de 3 jugadores · {sobresRestantes} restantes
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-2">
        {error ? (
          <p className="mb-4 text-center text-sm text-presi-red">{error}</p>
        ) : null}

        {options.length > 0 && sessionId ? (
          <PackOpenAnimation
            options={options}
            packNumber={packNumber}
            escudoConfig={escudoConfig}
            onSelect={handleSelect}
          />
        ) : (
          !error && (
            <p className="text-center text-white/60">
              {selecting ? "Fichando jugador..." : "Cargando..."}
            </p>
          )
        )}
      </div>
    </div>
  );
}
