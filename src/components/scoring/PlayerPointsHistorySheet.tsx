"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Crown } from "lucide-react";
import { CloseButton } from "@/components/ui/close-button";
import { ClubKitRenderer } from "@/components/escudo/ClubKitRenderer";
import {
  getPlayerPointsHistory,
  type PlayerPointsHistory,
} from "@/lib/actions/player-points";
import type { EscudoConfig, Player } from "@/lib/game/types";
import { cn } from "@/lib/utils";

type PlayerLite = Pick<
  Player,
  "id" | "nombre" | "posicion" | "equipo_real" | "photo_url" | "rareza"
>;

const SOURCE_LABEL: Record<string, string> = {
  starter: "Titular",
  bench_sub: "Suplente",
  bench_boost: "Banca",
};

/** Sheet: total fantasy points + jornada-by-jornada history. */
export function PlayerPointsHistorySheet({
  open,
  player,
  clubId = null,
  escudoConfig = null,
  title,
  onClose,
}: {
  open: boolean;
  player: PlayerLite | null;
  /** When set, only points for that club; otherwise all clubs. */
  clubId?: string | null;
  escudoConfig?: EscudoConfig | null;
  title?: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<PlayerPointsHistory | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !player?.id) {
      setHistory(null);
      return;
    }
    startTransition(async () => {
      const data = await getPlayerPointsHistory(player.id, clubId);
      setHistory(data);
    });
  }, [open, player?.id, clubId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !player || !mounted) return null;

  const total = history?.total ?? 0;
  const rows = history?.gameweeks ?? [];

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 m-4 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-presi-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              <ClubKitRenderer config={escudoConfig} size={44} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-display text-base text-presi-gold">
                {player.nombre}
              </p>
              <p className="text-[10px] text-white/50">
                {title ??
                  (clubId
                    ? "Puntos en este club"
                    : "Puntos en PRESI · temporada")}
                {" · "}
                {player.posicion} · {player.equipo_real}
              </p>
            </div>
          </div>
          <CloseButton onClick={onClose} variant="inline" className="h-9 w-9" />
        </div>

        <div className="border-b border-white/10 bg-presi-gold/10 px-4 py-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-presi-gold/70">
            Total temporada
          </p>
          <p className="text-3xl font-black text-presi-gold">
            {pending && !history ? "…" : `${total > 0 ? "+" : ""}${total}`}
            <span className="ml-1 text-sm font-semibold text-presi-gold/70">
              pts
            </span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Jornada a jornada
          </p>
          {pending && !history ? (
            <p className="py-8 text-center text-sm text-white/50">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">
              Aún no ha sumado puntos esta temporada.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {rows.map((row) => (
                <li
                  key={row.gameweekId}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                      J{row.round}
                      {row.isCaptain ? (
                        <Crown className="h-3.5 w-3.5 text-presi-gold" />
                      ) : null}
                    </p>
                    <p className="truncate text-[10px] text-white/45">
                      {row.source
                        ? SOURCE_LABEL[row.source] ?? row.source
                        : "—"}
                      {row.minutes > 0 ? ` · ${row.minutes}'` : ""}
                      {row.clubNombre ? ` · ${row.clubNombre}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-base font-black",
                      row.points > 0
                        ? "text-presi-gold"
                        : row.points < 0
                          ? "text-presi-red"
                          : "text-white/40"
                    )}
                  >
                    {row.points > 0 ? "+" : ""}
                    {row.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
