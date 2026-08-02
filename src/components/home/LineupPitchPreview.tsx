"use client";

import { useMemo } from "react";
import { PitchEmptySlot, PitchPlayerCard } from "@/components/plantilla/PitchPlayerCard";
import type { RivalLineupPlayer } from "@/lib/actions/rival-lineup";
import { getFormationSlots } from "@/lib/game/formation";
import { buildStarterSlotMapFromIds } from "@/lib/game/lineup-slots";
import type { EscudoConfig, Player, Position, RosterPlayer } from "@/lib/game/types";

const ROWS: Position[] = ["DEL", "MED", "DEF", "GK"];

function toRosterPlayer(p: RivalLineupPlayer): RosterPlayer {
  return {
    id: p.id,
    api_football_id: null,
    nombre: p.nombre,
    equipo_real: p.equipo_real,
    posicion: p.posicion,
    rareza: p.rareza,
    costo_base: 0,
    photo_url: p.photo_url,
  };
}

/** Read-only pitch layout (same look as Plantilla, no drag). */
export function LineupPitchPreview({
  formation,
  starters,
  captainId,
  escudoConfig,
  onPlayerClick,
}: {
  formation: string;
  starters: RivalLineupPlayer[];
  captainId?: string | null;
  escudoConfig?: EscudoConfig | null;
  onPlayerClick?: (player: RivalLineupPlayer) => void;
}) {
  const { starterSlotMap, playersById, pointsById, starterById } = useMemo(() => {
    const map = new Map<string, Player>();
    const points = new Map<string, number | null>();
    const byId = new Map<string, RivalLineupPlayer>();
    for (const p of starters) {
      map.set(p.id, toRosterPlayer(p));
      points.set(p.id, p.points ?? null);
      byId.set(p.id, p);
    }
    return {
      playersById: map,
      pointsById: points,
      starterById: byId,
      starterSlotMap: buildStarterSlotMapFromIds(
        formation,
        starters.map((p) => p.id),
        map
      ),
    };
  }, [formation, starters]);

  const slotCounts = getFormationSlots(formation);

  return (
    <div className="squad-pitch relative overflow-hidden rounded-2xl border border-presi-gold/20 px-1.5 py-3 sm:px-2 sm:py-4">
      <div className="pointer-events-none absolute inset-0 squad-pitch-lines" />
      <p className="relative mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/45">
        Formación {formation}
      </p>
      <div className="relative space-y-2 sm:space-y-3">
        {ROWS.map((pos) => (
          <div key={pos} className="flex justify-center gap-1 sm:gap-1.5">
            {Array.from({ length: slotCounts[pos] }).map((_, index) => {
              const slotKey = `${pos}-${index}`;
              const playerId = starterSlotMap[slotKey];
              const player = playerId ? playersById.get(playerId) : null;
              const previewPlayer = playerId
                ? starterById.get(playerId)
                : null;

              if (player) {
                return (
                  <PitchPlayerCard
                    key={slotKey}
                    player={player as RosterPlayer}
                    escudoConfig={escudoConfig}
                    isCaptain={player.id === captainId}
                    size="sm"
                    showGameweekPoints
                    gameweekPoints={pointsById.get(player.id) ?? null}
                    onClick={
                      onPlayerClick && previewPlayer
                        ? () => onPlayerClick(previewPlayer)
                        : undefined
                    }
                  />
                );
              }

              return (
                <PitchEmptySlot
                  key={slotKey}
                  position={pos}
                  slotKey={slotKey}
                  isDropTarget={false}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
