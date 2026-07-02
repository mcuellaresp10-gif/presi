"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PackCompleteMessage,
  PackOpenAnimation,
} from "@/components/packs/PackOpenAnimation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { openWelcomePack, selectPackPlayer } from "@/lib/actions/packs";
import type { Player } from "@/lib/game/types";

export function SobresClient({ sobresRestantes }: { sobresRestantes: number }) {
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
      <div className="py-12 text-center text-andes-deep/70">
        Preparando sobre...
      </div>
    );
  }

  if (completed) {
    return <PackCompleteMessage />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="paper-texture">
        <CardHeader>
          <CardTitle>Sobres de bienvenida</CardTitle>
          <p className="text-sm text-andes-deep/70">
            Te quedan {sobresRestantes} sobres · elige 1 de 3 jugadores por sobre
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-center text-sm text-red-600">{error}</p>
          )}

          {options.length > 0 && sessionId ? (
            <PackOpenAnimation
              options={options}
              packNumber={packNumber}
              onSelect={handleSelect}
            />
          ) : (
            !error && (
              <p className="text-center text-andes-deep/70">
                {selecting ? "Fichando jugador..." : "Cargando..."}
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
