"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerCard } from "@/components/cards/PlayerCard";
import { WildCardTile } from "@/components/wild-cards/WildCardRewardCard";
import { Button } from "@/components/ui/button";
import {
  activateWildCard,
  getFreeSignPool,
} from "@/lib/actions/wild-cards";
import type { WildCardInventoryItem } from "@/lib/actions/wild-cards";
import {
  getWildCardDefinition,
} from "@/lib/game/wild-cards";
import type { Player } from "@/lib/game/types";
import { useToast } from "@/components/ui/use-toast";

export function WildCardInventory({
  cards,
  rosterPlayers = [],
}: {
  cards: WildCardInventoryItem[];
  rosterPlayers?: Player[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [picker, setPicker] = useState<{
    cardId: string;
    mode: "free_sign" | "free_renewal";
  } | null>(null);
  const [signPool, setSignPool] = useState<Player[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);

  if (cards.length === 0) {
    return (
      <p className="text-sm text-andes-deep/50">
        No tienes Wild Cards. Consíguelas con suerte en scouting.
      </p>
    );
  }

  async function openPicker(cardId: string, mode: "free_sign" | "free_renewal") {
    if (mode === "free_sign") {
      setPoolLoading(true);
      const pool = await getFreeSignPool();
      setSignPool(pool as Player[]);
      setPoolLoading(false);
      if (!pool.length) {
        toast({
          title: "Sin jugadores",
          description: "No hay jugadores disponibles para fichar.",
        });
        return;
      }
    }
    setPicker({ cardId, mode });
  }

  async function confirmActivate(cardId: string, playerId: string) {
    setLoadingId(cardId);
    const payload =
      picker?.mode === "free_sign"
        ? { signPlayerId: playerId }
        : { playerId };

    const result = await activateWildCard(cardId, payload);
    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error });
    } else {
      toast({
        title: "Carta activada",
        description: result.cardName ?? "Wild Card usada",
      });
      setPicker(null);
      router.refresh();
    }
    setLoadingId(null);
  }

  async function handleActivate(card: WildCardInventoryItem) {
    if (card.status === "active") return;

    const def = getWildCardDefinition(card.cardType);

    if (card.cardType === "free_sign") {
      await openPicker(card.id, "free_sign");
      return;
    }

    if (card.cardType === "free_renewal") {
      if (!rosterPlayers.length) {
        toast({ title: "Sin plantilla", description: "No tienes jugadores." });
        return;
      }
      await openPicker(card.id, "free_renewal");
      return;
    }

    if (
      !confirm(
        `¿Activar "${def.name}"?\n\n${def.description}`
      )
    ) {
      return;
    }

    setLoadingId(card.id);
    const result = await activateWildCard(card.id);
    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error });
    } else {
      toast({
        title: "Carta activada",
        description: result.cardName ?? "Wild Card activada",
      });
      router.refresh();
    }
    setLoadingId(null);
  }

  const pickerPlayers =
    picker?.mode === "free_sign" ? signPool : rosterPlayers;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <WildCardTile
            key={card.id}
            cardType={card.cardType}
            status={card.status}
            onActivate={
              card.status === "available"
                ? () => handleActivate(card)
                : undefined
            }
            loading={loadingId === card.id}
          />
        ))}
      </div>

      {picker && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-lg font-bold text-andes-deep">
              {picker.mode === "free_sign"
                ? "Elige jugador a fichar"
                : "Elige jugador a renovar"}
            </h3>
            {poolLoading ? (
              <p className="py-8 text-center text-sm text-andes-deep/60">
                Cargando...
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {pickerPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    className="w-full text-left"
                    onClick={() => confirmActivate(picker.cardId, player.id)}
                    disabled={loadingId === picker.cardId}
                  >
                    <PlayerCard player={player} compact />
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setPicker(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
