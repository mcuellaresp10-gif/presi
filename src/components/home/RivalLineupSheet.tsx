"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { CloseButton } from "@/components/ui/close-button";
import { ClubKitRenderer } from "@/components/escudo/ClubKitRenderer";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { LineupPitchPreview } from "@/components/home/LineupPitchPreview";
import { PlayerPointsHistorySheet } from "@/components/scoring/PlayerPointsHistorySheet";
import { getWildCardIcon } from "@/components/wild-cards/wild-card-icons";
import type {
  RivalLineupPlayer,
  RivalLineupPreview,
} from "@/lib/actions/rival-lineup";
import { POSITION_SHORT } from "@/lib/game/player-display";
import type { EscudoConfig } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function RivalLineupSheet({
  open,
  preview,
  loading,
  onClose,
}: {
  open: boolean;
  preview: RivalLineupPreview | null;
  loading?: boolean;
  onClose: () => void;
}) {
  const [pointsPlayer, setPointsPlayer] = useState<RivalLineupPlayer | null>(
    null
  );

  useEffect(() => {
    if (!open) {
      setPointsPlayer(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pointsPlayer) onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, pointsPlayer]);

  if (!open) return null;

  const formation = preview?.formation ?? "4-4-2";
  const hasLineup =
    !!preview &&
    (preview.starters.length > 0 || preview.bench.length > 0);

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
        <button
          type="button"
          aria-label="Cerrar"
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          onClick={onClose}
        />

        <div
          role="dialog"
          aria-labelledby="rival-lineup-title"
          className="relative z-10 mx-4 mb-6 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-presi-surface shadow-2xl sm:mb-0"
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {preview?.escudoConfig ? (
                <EscudoRenderer config={preview.escudoConfig} size={40} />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm">
                  ?
                </div>
              )}
              <div className="min-w-0">
                <p
                  id="rival-lineup-title"
                  className="truncate text-display text-base text-presi-gold"
                >
                  {preview?.clubNombre ?? "Rival"}
                </p>
                <p className="text-[10px] text-white/50">
                  {preview?.gameweekRound
                    ? `Alineación J${preview.gameweekRound}`
                    : "Alineación"}
                  {preview?.formation ? ` · ${preview.formation}` : ""}
                  {preview?.locked
                    ? " · bloqueada"
                    : preview?.source === "draft"
                      ? " · provisional"
                      : ""}
                </p>
              </div>
            </div>
            <CloseButton
              onClick={onClose}
              variant="inline"
              className="h-9 w-9"
              iconClassName="h-4 w-4"
            />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4">
            {loading ? (
              <p className="py-10 text-center text-sm text-white/50">Cargando…</p>
            ) : !hasLineup ? (
              <p className="py-8 text-center text-sm text-white/55">
                Este club aún no tiene alineación para la jornada.
              </p>
            ) : (
              <>
                <p className="text-center text-[10px] text-white/40">
                  Toca un jugador para ver sus puntos por jornada
                </p>
                {preview.starters.length > 0 ? (
                  <LineupPitchPreview
                    formation={formation}
                    starters={preview.starters}
                    captainId={preview.captainId}
                    escudoConfig={preview.escudoConfig}
                    onPlayerClick={setPointsPlayer}
                  />
                ) : null}

                {preview.bench.length > 0 ? (
                  <section>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Banca ({preview.bench.length})
                    </p>
                    <ul className="space-y-1.5">
                      {preview.bench.map((p) => (
                        <BenchPlayerRow
                          key={p.id}
                          player={p}
                          escudoConfig={preview.escudoConfig}
                          onClick={() => setPointsPlayer(p)}
                        />
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Wild Cards de la jornada
                  </p>
                  {preview.wildCards.length === 0 ? (
                    <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
                      No activó Wild Cards en esta jornada.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {preview.wildCards.map((wc) => {
                        const Icon = getWildCardIcon(wc.cardType);
                        return (
                          <li
                            key={wc.cardType}
                            className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-presi-gold/15 text-presi-gold">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">
                                {wc.name}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-snug text-white/55">
                                {wc.description}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      <PlayerPointsHistorySheet
        open={!!pointsPlayer}
        player={pointsPlayer}
        clubId={preview?.clubId ?? null}
        escudoConfig={preview?.escudoConfig}
        title={
          preview?.clubNombre
            ? `Puntos en ${preview.clubNombre}`
            : undefined
        }
        onClose={() => setPointsPlayer(null)}
      />
    </>
  );
}

function BenchPlayerRow({
  player,
  escudoConfig,
  onClick,
}: {
  player: RivalLineupPreview["starters"][number];
  escudoConfig?: EscudoConfig | null;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition hover:bg-white/5",
          player.isCaptain
            ? "border-presi-gold/40 bg-presi-gold/10"
            : "border-white/10 bg-white/5"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          <ClubKitRenderer config={escudoConfig} size={36} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
            {player.nombre}
            {player.isCaptain ? (
              <Crown className="h-3.5 w-3.5 shrink-0 text-presi-gold" />
            ) : null}
          </p>
          <p className="truncate text-[10px] text-white/45">
            {POSITION_SHORT[player.posicion]} · {player.equipo_real}
            {player.isCaptain ? " · Capitán" : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-sm font-black",
            player.points != null && player.points > 0
              ? "text-presi-gold"
              : player.points != null && player.points < 0
                ? "text-presi-red"
                : "text-white/40"
          )}
        >
          {player.points != null
            ? `${player.points > 0 ? "+" : ""}${player.points}`
            : "—"}
        </span>
      </button>
    </li>
  );
}
