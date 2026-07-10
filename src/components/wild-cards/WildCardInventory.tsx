"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerCard } from "@/components/cards/PlayerCard";
import {
  WildCardDetailSheet,
  WildCardTile,
} from "@/components/wild-cards/WildCardRewardCard";
import { Button } from "@/components/ui/button";
import { CloseButton } from "@/components/ui/close-button";
import {
  activateWildCard,
  getFreeSignPool,
} from "@/lib/actions/wild-cards";
import type { WildCardInventoryItem } from "@/lib/actions/wild-cards";
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
  const [selected, setSelected] = useState<WildCardInventoryItem | null>(null);
  const [picker, setPicker] = useState<{
    cardId: string;
    mode: "free_sign" | "free_renewal";
  } | null>(null);
  const [signPool, setSignPool] = useState<Player[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);

  if (cards.length === 0) {
    return (
      <p className="text-sm text-white/50">
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
    setSelected(null);
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
    if (card.status !== "available") return;

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

    setLoadingId(card.id);
    const result = await activateWildCard(card.id);
    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error });
    } else {
      toast({
        title: "Carta activada",
        description: result.cardName ?? "Wild Card activada",
      });
      setSelected(null);
      router.refresh();
    }
    setLoadingId(null);
  }

  const pickerPlayers =
    picker?.mode === "free_sign" ? signPool : rosterPlayers;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <WildCardTile
            key={card.id}
            cardType={card.cardType}
            status={card.status}
            onOpen={() => setSelected(card)}
          />
        ))}
      </div>

      {selected ? (
        <WildCardDetailSheet
          open
          cardType={selected.cardType}
          status={selected.status}
          onClose={() => setSelected(null)}
          onActivate={
            selected.status === "available"
              ? () => handleActivate(selected)
              : undefined
          }
          loading={loadingId === selected.id}
        />
      ) : null}

      {picker ? (
        <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setPicker(null)}
          />
          <div className="relative z-10 mx-4 mb-6 flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-presi-surface shadow-2xl sm:mb-0">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-display text-sm text-presi-gold">
                {picker.mode === "free_sign"
                  ? "Elige jugador a fichar"
                  : "Elige jugador a renovar"}
              </h3>
              <CloseButton
                onClick={() => setPicker(null)}
                variant="inline"
                className="h-9 w-9"
                iconClassName="h-4 w-4"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {poolLoading ? (
                <p className="py-8 text-center text-sm text-white/60">
                  Cargando...
                </p>
              ) : (
                <div className="space-y-2">
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
            </div>
            <div className="border-t border-white/10 px-4 py-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPicker(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
