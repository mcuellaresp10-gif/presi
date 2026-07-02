"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  renewPlayerContract,
  releasePlayer,
} from "@/lib/actions/contracts";
import {
  canRenewContract,
  getJornadasTotal,
  getRenewalCost,
  isContractExpiringSoon,
} from "@/lib/game";
import {
  getPlayerRating,
  POSITION_PITCH_COLOR,
  POSITION_SHORT,
} from "@/lib/game/player-display";
import { PlayerPhoto } from "@/components/plantilla/PlayerPhoto";
import { POSITION_LABELS } from "@/lib/game/types";
import type { RosterPlayer } from "@/lib/game/types";
import { cn, formatCOP, formatCompactMoney } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const RARITY_LABELS = {
  bronce: "Bronce",
  plata: "Plata",
  oro: "Oro",
  leyenda: "Leyenda",
};

export function PlayerDetailPanel({
  player,
  isStarter,
  isBench = false,
  isCaptain = false,
  open,
  onClose,
  onToggleStarter,
  onAddToBench,
  onRemoveFromBench,
  onSetCaptain,
  lineupLocked = false,
  budgetUsed,
  budgetTotal,
  remainingBudget,
  oficinaNivel = 1,
}: {
  player: RosterPlayer | null;
  isStarter: boolean;
  isBench?: boolean;
  isCaptain?: boolean;
  open: boolean;
  onClose: () => void;
  onToggleStarter: () => void;
  onAddToBench?: () => void;
  onRemoveFromBench?: () => void;
  onSetCaptain?: () => void;
  lineupLocked?: boolean;
  budgetUsed: number;
  budgetTotal: number;
  remainingBudget: number;
  oficinaNivel?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"renew" | "release" | null>(null);

  if (!open || !player) return null;

  const rating = getPlayerRating(player);
  const pos = player.posicion;
  const budgetPercent = Math.min(100, (budgetUsed / budgetTotal) * 100);
  const jornadas = player.jornadas_restantes ?? 0;
  const jornadasTotal = getJornadasTotal(player.rareza);
  const contractPercent = Math.min(
    100,
    (jornadas / Math.max(jornadasTotal, 1)) * 100
  );
  const renovaciones = player.renovaciones ?? 0;
  const renewalCost = getRenewalCost(
    player.costo_base,
    oficinaNivel,
    renovaciones
  );
  const expiringSoon = isContractExpiringSoon(jornadas);

  async function handleRenew() {
    setLoading("renew");
    const result = await renewPlayerContract(player!.id);
    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error });
    } else {
      toast({ title: "Contrato renovado" });
      router.refresh();
      onClose();
    }
    setLoading(null);
  }

  async function handleRelease() {
    setLoading("release");
    const result = await releasePlayer(player!.id);
    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error });
    } else {
      toast({
        title: "Jugador liberado",
        description:
          result.refund && result.refund > 0
            ? `Reembolso: ${formatCompactMoney(result.refund)}`
            : undefined,
      });
      router.refresh();
      onClose();
    }
    setLoading(null);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#0c1424] text-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-andes-accent to-andes-deep px-4 pb-16 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg bg-black/20 p-1.5 text-white/80 hover:bg-black/30"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-4">
            <div>
              <p className="text-4xl font-black leading-none">{rating}</p>
              <p className="mt-2 text-lg font-bold uppercase tracking-wide">
                {player.nombre}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-bold",
                    POSITION_PITCH_COLOR[pos]
                  )}
                >
                  {POSITION_SHORT[pos]}
                </span>
                <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-semibold uppercase">
                  {RARITY_LABELS[player.rareza]}
                </span>
              </div>
            </div>

            <div className="relative ml-auto h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 shadow-xl">
              <PlayerPhoto
                nombre={player.nombre}
                photoUrl={player.photo_url}
                sizes="112px"
                initialsClassName="text-2xl"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <section
            className={cn(
              "rounded-xl p-4",
              expiringSoon ? "bg-amber-500/15 ring-1 ring-amber-400/40" : "bg-white/5"
            )}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              Contrato
            </p>
            <p className="text-sm font-medium">
              {jornadas} partido{jornadas !== 1 ? "s" : ""} restante
              {jornadas !== 1 ? "s" : ""} como titular
            </p>
            <Progress value={contractPercent} className="mt-2 h-2 bg-white/10" />
            <p className="mt-1 text-[10px] text-white/50">
              Renovaciones: {renovaciones}/3
            </p>
          </section>

          <section className="rounded-xl bg-white/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              En tu plantilla
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/25 p-3">
                <p className="text-[10px] uppercase text-white/50">Estado</p>
                <p className="font-bold">
                  {isStarter
                    ? isCaptain
                      ? "11 inicial · Capitán"
                      : "11 inicial"
                    : isBench
                      ? "Banca"
                      : "Reserva"}
                </p>
              </div>
              <div className="rounded-lg bg-black/25 p-3">
                <p className="text-[10px] uppercase text-white/50">Costo</p>
                <p className="font-bold">
                  {formatCompactMoney(player.costo_base)}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="rounded bg-andes-accent px-2 py-0.5 font-semibold">
                  PRESUPUESTO
                </span>
                <span>
                  {formatCompactMoney(budgetUsed)}/
                  {formatCompactMoney(budgetTotal)}
                </span>
              </div>
              <Progress value={budgetPercent} className="h-2 bg-white/10" />
            </div>
          </section>

          <section className="rounded-xl bg-white/5 p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-white/10 py-2">
                <dt className="text-white/50">Posición</dt>
                <dd className="font-medium">{POSITION_LABELS[pos]}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-white/50">Valor fichaje</dt>
                <dd className="font-medium">{formatCOP(player.costo_base)}</dd>
              </div>
            </dl>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-cyan-500 font-bold text-andes-deep hover:bg-cyan-400"
              disabled={
                loading !== null ||
                !canRenewContract(renovaciones) ||
                remainingBudget < renewalCost
              }
              onClick={handleRenew}
            >
              {loading === "renew"
                ? "..."
                : `Renovar ${formatCompactMoney(renewalCost)}`}
            </Button>
            <Button
              variant="outline"
              className="border-red-400/50 text-red-300 hover:bg-red-500/10"
              disabled={loading !== null}
              onClick={handleRelease}
            >
              {loading === "release" ? "..." : "Liberar"}
            </Button>
          </div>

          {!lineupLocked && (
            <div className="space-y-2">
              {isStarter && onSetCaptain && !isCaptain && (
                <Button
                  className="w-full border-amber-400/50 bg-amber-500/15 py-5 text-base font-bold text-amber-100 hover:bg-amber-500/25"
                  variant="outline"
                  onClick={onSetCaptain}
                >
                  Elegir capitán (puntos x2)
                </Button>
              )}
              {isStarter && isCaptain && (
                <p className="rounded-lg bg-amber-500/15 px-3 py-2 text-center text-sm font-semibold text-amber-200">
                  Capitán — sus puntos cuentan doble esta jornada
                </p>
              )}
              <Button
                className={cn(
                  "w-full py-5 text-base font-bold",
                  isStarter
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-emerald-600 hover:bg-emerald-500"
                )}
                onClick={onToggleStarter}
              >
                {isStarter ? "Quitar del 11 inicial" : "Poner en 11 inicial"}
              </Button>
              {!isStarter && !isBench && onAddToBench && (
                <Button
                  variant="outline"
                  className="w-full border-cyan-400/40 text-cyan-200"
                  onClick={onAddToBench}
                >
                  Añadir a banca
                </Button>
              )}
              {isBench && onRemoveFromBench && (
                <Button
                  variant="outline"
                  className="w-full border-white/20"
                  onClick={onRemoveFromBench}
                >
                  Quitar de banca
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
