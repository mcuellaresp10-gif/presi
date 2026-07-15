"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlayerCard } from "@/components/cards/PlayerCard";
import { Button } from "@/components/ui/button";
import { signLoanPlayer } from "@/lib/actions/tienda";
import type { TiendaLoanOffer } from "@/lib/tienda/types";
import { Gem } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function LoanPlayerCard({
  offer,
  gemas,
  disabled,
  onSigned,
}: {
  offer: TiendaLoanOffer;
  gemas: number;
  disabled?: boolean;
  onSigned?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const player = offer.player;
  const canAfford = gemas >= offer.costoGemas;
  const isClaimed = offer.claimed;

  async function handleSign() {
    if (!player || isClaimed || !canAfford || disabled) return;
    setLoading(true);
    const result = await signLoanPlayer(offer.slotIndex);
    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error });
    } else {
      toast({
        title: "Préstamo firmado",
        description: `${player.nombre} se une por ${offer.jornadasPrestamo} jornadas.`,
      });
      router.refresh();
      onSigned?.();
    }
    setLoading(false);
  }

  if (!player) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-center text-xs text-white/40">
        Oferta no disponible
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative space-y-3 rounded-xl border bg-presi-surface/80 p-3",
        isClaimed
          ? "border-white/10 opacity-60"
          : "border-white/15 shadow-lg"
      )}
    >
      <span className="absolute right-2 top-2 z-10 rounded bg-presi-bg/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-presi-gold ring-1 ring-presi-gold/40">
        Préstamo {offer.jornadasPrestamo}J
      </span>

      <PlayerCard player={player} compact />

      <Button
        className="w-full bg-violet-600 font-bold text-white hover:bg-violet-500"
        disabled={
          loading || isClaimed || !canAfford || disabled || !player
        }
        onClick={handleSign}
      >
        {loading ? (
          "..."
        ) : isClaimed ? (
          "Firmado"
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Gem className="h-3.5 w-3.5" />
            {offer.costoGemas} gemas
          </span>
        )}
      </Button>
    </div>
  );
}
