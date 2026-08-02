"use client";

import { useEffect, useState, useTransition } from "react";
import { Crown } from "lucide-react";
import {
  getPlayerPointsHistory,
  type PlayerGameweekPointsRow,
} from "@/lib/actions/player-points";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<string, string> = {
  starter: "Titular",
  bench_sub: "Suplente",
  bench_boost: "Banca",
};

/** Inline jornada-by-jornada list (e.g. inside PlayerDetailPanel). */
export function PlayerPointsHistoryList({
  playerId,
  clubId = null,
  initialTotal,
}: {
  playerId: string;
  clubId?: string | null;
  /** Show immediately while the by-gameweek list loads. */
  initialTotal?: number;
}) {
  const [rows, setRows] = useState<PlayerGameweekPointsRow[] | null>(null);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof initialTotal === "number") {
      setTotal(initialTotal);
    }
  }, [initialTotal, playerId]);

  useEffect(() => {
    if (!playerId) return;
    setRows(null);
    startTransition(async () => {
      const data = await getPlayerPointsHistory(playerId, clubId);
      setRows(data.gameweeks);
      setTotal(data.total);
    });
  }, [playerId, clubId]);

  return (
    <section className="rounded-xl bg-presi-gold/10 p-4 ring-1 ring-presi-gold/25">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-presi-gold/70">
        Aporte al club
      </p>
      <p className="text-2xl font-black text-presi-gold">
        {`${total > 0 ? "+" : ""}${total.toLocaleString("es-CO")}`}
        <span className="ml-1 text-sm font-semibold text-presi-gold/70">
          pts temporada
        </span>
      </p>

      <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        Por jornada
      </p>
      {pending && rows === null ? (
        <p className="text-sm text-white/50">Cargando jornadas…</p>
      ) : !rows?.length ? (
        <p className="text-sm text-white/50">
          Aún no ha sumado puntos esta temporada.
        </p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {rows.map((row) => (
            <li
              key={row.gameweekId}
              className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-2.5 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-1 text-xs text-white/80">
                J{row.round}
                {row.isCaptain ? (
                  <Crown className="h-3 w-3 shrink-0 text-presi-gold" />
                ) : null}
                <span className="truncate text-white/40">
                  {row.source
                    ? ` · ${SOURCE_LABEL[row.source] ?? row.source}`
                    : ""}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs font-black",
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
    </section>
  );
}
