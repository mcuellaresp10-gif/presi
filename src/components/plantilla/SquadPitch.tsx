"use client";

import { useState } from "react";
import type { EscudoConfig, Player, Position } from "@/lib/game/types";
import { getFormationSlots } from "@/lib/game/formation";
import { canPlacePlayerOnStarterSlot } from "@/lib/game/lineup-slots";
import { cn } from "@/lib/utils";
import { PitchEmptySlot, PitchPlayerCard } from "./PitchPlayerCard";

const ROWS: { pos: Position; label: string }[] = [
  { pos: "DEL", label: "Delanteros" },
  { pos: "MED", label: "Mediocampo" },
  { pos: "DEF", label: "Defensa" },
  { pos: "GK", label: "Portero" },
];

export function SquadPitch({
  formation,
  starterSlotMap,
  playersById,
  escudoConfig,
  captainId,
  lineupLocked,
  draggingPlayerId,
  onPlayerClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDropOnSlot,
}: {
  formation: string;
  starterSlotMap: Record<string, string | null>;
  playersById: Map<string, Player>;
  escudoConfig?: EscudoConfig | null;
  captainId?: string | null;
  lineupLocked?: boolean;
  draggingPlayerId?: string | null;
  onPlayerClick: (player: Player) => void;
  onDragStart: (
    e: React.DragEvent,
    playerId: string,
    source: { zone: "starter"; slotKey: string }
  ) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropOnSlot: (
    e: React.DragEvent,
    slotKey: string,
    position: Position
  ) => void;
}) {
  const slotCounts = getFormationSlots(formation);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const rosterById = playersById ?? new Map<string, Player>();
  const dragPlayer = draggingPlayerId
    ? rosterById.get(draggingPlayerId)
    : null;

  function slotValid(pos: Position) {
    if (!dragPlayer) return true;
    return canPlacePlayerOnStarterSlot(dragPlayer, pos);
  }

  return (
    <div className="squad-pitch relative overflow-hidden rounded-2xl border border-presi-cyan/20 px-2 py-4">
      <div className="pointer-events-none absolute inset-0 squad-pitch-lines" />

      <div className="relative space-y-3">
        {ROWS.map(({ pos }) => (
          <div key={pos} className="flex justify-center gap-1.5 sm:gap-2">
            {Array.from({ length: slotCounts[pos] }).map((_, index) => {
              const slotKey = `${pos}-${index}`;
              const playerId = starterSlotMap[slotKey];
              const player = playerId ? rosterById.get(playerId) : null;
              const valid = slotValid(pos);
              const isOver = dragOverKey === slotKey;

              if (player) {
                return (
                  <div
                    key={slotKey}
                    onDragOver={(e) => {
                      if (!valid && dragPlayer) return;
                      onDragOver(e);
                      setDragOverKey(slotKey);
                    }}
                    onDragLeave={() =>
                      setDragOverKey((k) => (k === slotKey ? null : k))
                    }
                    onDrop={(e) => {
                      setDragOverKey(null);
                      if (!valid && dragPlayer) return;
                      onDropOnSlot(e, slotKey, pos);
                    }}
                    className={cn(
                      "rounded-lg transition-shadow",
                      isOver && valid && "ring-2 ring-presi-cyan/60",
                      isOver && !valid && dragPlayer && "ring-2 ring-presi-red/50"
                    )}
                  >
                    <PitchPlayerCard
                      player={player as Player & { equipo_real: string }}
                      escudoConfig={escudoConfig}
                      isCaptain={player.id === captainId}
                      draggable={!lineupLocked}
                      onDragStart={(e) =>
                        onDragStart(e, player.id, {
                          zone: "starter",
                          slotKey,
                        })
                      }
                      onDragEnd={onDragEnd}
                      onClick={() => onPlayerClick(player)}
                    />
                  </div>
                );
              }

              return (
                <PitchEmptySlot
                  key={slotKey}
                  position={pos}
                  slotKey={slotKey}
                  isDropTarget={!lineupLocked}
                  isDragOver={isOver}
                  isValidDrop={valid}
                  onDragOver={(e) => {
                    if (!valid && dragPlayer) return;
                    onDragOver(e);
                    setDragOverKey(slotKey);
                  }}
                  onDragLeave={() =>
                    setDragOverKey((k) => (k === slotKey ? null : k))
                  }
                  onDrop={(e) => {
                    setDragOverKey(null);
                    if (!valid && dragPlayer) return;
                    onDropOnSlot(e, slotKey, pos);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
