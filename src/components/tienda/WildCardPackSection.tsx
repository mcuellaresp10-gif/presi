"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { purchaseWildCardPack } from "@/lib/actions/tienda";
import type { TiendaWildCardPack } from "@/lib/tienda/types";
import type { WildCardPackTierId } from "@/lib/game/wild-card-packs";
import { Gem, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function WildCardPackSection({
  packs,
  gemas,
  inventoryCount,
}: {
  packs: TiendaWildCardPack[];
  gemas: number;
  inventoryCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<WildCardPackTierId | null>(null);

  async function handleBuy(tierId: WildCardPackTierId) {
    setLoading(tierId);
    const result = await purchaseWildCardPack(tierId);
    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error });
    } else if (result.card) {
      toast({
        title: "Sobre abierto",
        description: `Obtuviste: ${result.card.name}`,
      });
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Sobres Wild Card
        </h2>
        <p className="text-[11px] text-white/45">
          Inventario: {inventoryCount}/6 cartas disponibles
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {packs.map((pack) => {
          const canAfford = gemas >= pack.costGems;
          const canBuy = pack.canBuy && canAfford;
          return (
            <div
              key={pack.id}
              className={cn(
                "flex flex-col rounded-xl border border-white/10 bg-gradient-to-br p-4 shadow-lg",
                pack.color
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white/80" />
                <h3 className="text-sm font-bold text-white">{pack.name}</h3>
              </div>
              <p className="mb-4 flex-1 text-xs leading-relaxed text-white/75">
                {pack.description}
              </p>
              {!pack.canBuy && pack.blockedReason && (
                <p className="mb-2 text-[10px] text-amber-100/90">
                  {pack.blockedReason}
                </p>
              )}
              <Button
                className="w-full bg-black/35 font-bold text-white hover:bg-black/50"
                disabled={!canBuy || loading !== null}
                onClick={() => handleBuy(pack.id)}
              >
                {loading === pack.id ? (
                  "..."
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Gem className="h-3.5 w-3.5" />
                    {pack.costGems} gemas
                  </span>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
