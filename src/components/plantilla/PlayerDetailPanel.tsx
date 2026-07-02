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
import { DEFAULT_LOAN_JORNADAS } from "@/lib/game/loan-market";
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

export type PlayerSquadStatus = "starter" | "bench" | "reserve";

const SQUAD_STATUS_OPTIONS: {
  value: PlayerSquadStatus;
  label: string;
  short: string;
}[] = [
  { value: "starter", label: "11 inicial", short: "11" },
  { value: "bench", label: "Banca", short: "Banca" },
  { value: "reserve", label: "Reserva", short: "Res." },
];

export function PlayerDetailPanel({
  player,
  isStarter,
  isBench = false,
  isCaptain = false,
  open,
  onClose,
  onStatusChange,
  onLockedStatusClick,
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
  onStatusChange: (status: PlayerSquadStatus) => void;
  onLockedStatusClick?: () => void;
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
  const isLoan = Boolean(player.es_prestamo);
  const loanJornadas = player.prestamo_jornadas_restantes ?? 0;
  const jornadasTotal = getJornadasTotal(player.rareza);
  const contractPercent = isLoan
    ? Math.min(
        100,
        (loanJornadas / Math.max(DEFAULT_LOAN_JORNADAS, 1)) * 100
      )
    : Math.min(100, (jornadas / Math.max(jornadasTotal, 1)) * 100);
  const renovaciones = player.renovaciones ?? 0;
  const renewalCost = getRenewalCost(
    player.costo_base,
    oficinaNivel,
    renovaciones
  );
  const expiringSoon = !isLoan && isContractExpiringSoon(jornadas);
  const squadStatus: PlayerSquadStatus = isStarter
    ? "starter"
    : isBench
      ? "bench"
      : "reserve";

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

      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-presi-surface text-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-presi-navy via-presi-cyan/90 to-presi-bg px-4 pb-16 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg bg-black/20 p-1.5 text-white/80 hover:bg-black/30"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-4">
            <div>
              <p className="text-display text-4xl leading-none text-presi-gold">{rating}</p>
              <p className="mt-2 text-lg font-bold uppercase tracking-wide text-white">
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
                {isLoan && (
                  <span className="rounded bg-cyan-500/25 px-2 py-0.5 text-xs font-semibold uppercase text-cyan-100">
                    Préstamo
                  </span>
                )}
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
              isLoan
                ? "bg-cyan-500/10 ring-1 ring-cyan-400/30"
                : expiringSoon
                  ? "bg-amber-500/15 ring-1 ring-amber-400/40"
                  : "bg-white/5"
            )}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              {isLoan ? "Préstamo" : "Contrato"}
            </p>
            <p className="text-sm font-medium">
              {isLoan
                ? `${loanJornadas} jornada${loanJornadas !== 1 ? "s" : ""} restante${loanJornadas !== 1 ? "s" : ""} en tu club`
                : `${jornadas} partido${jornadas !== 1 ? "s" : ""} restante${jornadas !== 1 ? "s" : ""} como titular`}
            </p>
            <Progress value={contractPercent} className="mt-2 h-2 bg-white/10" />
            {!isLoan && (
              <p className="mt-1 text-[10px] text-white/50">
                Renovaciones: {renovaciones}/3
              </p>
            )}
            {isLoan && (
              <p className="mt-1 text-[10px] text-cyan-200/70">
                Vuelve al mercado al terminar. No cuenta en tu presupuesto COP.
              </p>
            )}
          </section>

          <section className="rounded-xl bg-white/5 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
              En tu plantilla
            </p>
            <p className="mb-3 text-[11px] leading-snug text-white/45">
              {lineupLocked
                ? "La jornada actual ya comenzó. Los botones muestran el estado actual; podrás cambiarlos cuando abra la próxima jornada."
                : "Toca 11 inicial, Banca o Reserva para mover al jugador. Su rol en campo (delantero, defensa…) no se puede cambiar."}
            </p>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-presi-cyan/80">
              Estado en plantilla
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SQUAD_STATUS_OPTIONS.map(({ value, label, short }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    if (lineupLocked) {
                      onLockedStatusClick?.();
                      return;
                    }
                    if (squadStatus !== value) onStatusChange(value);
                  }}
                  className={cn(
                    "rounded-lg border py-3 text-center text-xs font-bold transition-all active:scale-[0.98]",
                    squadStatus === value
                      ? lineupLocked
                        ? "border-amber-400/50 bg-amber-500/20 text-amber-100"
                        : "border-presi-cyan bg-presi-cyan text-presi-bg shadow-md shadow-presi-cyan/20"
                      : lineupLocked
                        ? "border-white/10 bg-black/20 text-white/40"
                        : "border-white/15 bg-black/30 text-white/75 hover:border-presi-cyan/40 hover:bg-white/10"
                  )}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{short}</span>
                </button>
              ))}
            </div>
            {isCaptain && !lineupLocked && (
              <p className="mt-2 text-center text-[10px] font-semibold text-amber-300">
                Capitán — puntos x2 esta jornada
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/25 p-3">
                <p className="text-[10px] uppercase text-white/50">
                  Rol en campo
                </p>
                <p className="font-bold">{POSITION_LABELS[pos]}</p>
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
                <span className="rounded bg-presi-cyan px-2 py-0.5 font-semibold">
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
              <div className="flex justify-between py-2">
                <dt className="text-white/50">Valor fichaje</dt>
                <dd className="font-medium">{formatCOP(player.costo_base)}</dd>
              </div>
            </dl>
          </section>

          {!isLoan && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="bg-presi-gold font-bold text-white hover:bg-presi-gold/90"
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
          )}

          {!lineupLocked && isStarter && onSetCaptain && !isCaptain && (
            <Button
              className="w-full border-amber-400/50 bg-amber-500/15 py-5 text-base font-bold text-amber-100 hover:bg-amber-500/25"
              variant="outline"
              onClick={onSetCaptain}
            >
              Elegir capitán (puntos x2)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
