"use client";

import { useState } from "react";
import type { Player, Position } from "@/lib/game/types";
import { getFormationSlots } from "@/lib/game/formation";
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
  captainId,
  lineupLocked,
  onPlayerClick,
  onDragStart,
  onDragOver,
  onDropOnSlot,
}: {
  formation: string;
  starterSlotMap: Record<string, string | null>;
  playersById: Map<string, Player>;
  captainId?: string | null;
  lineupLocked?: boolean;
  onPlayerClick: (player: Player) => void;
  onDragStart: (
    e: React.DragEvent,
    playerId: string,
    source: { zone: "starter"; slotKey: string }
  ) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropOnSlot: (
    e: React.DragEvent,
    slotKey: string,
    position: Position
  ) => void;
}) {
  const slotCounts = getFormationSlots(formation);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  return (
    <div className="squad-pitch relative overflow-hidden rounded-2xl border border-cyan-500/20 px-2 py-4">
      <div className="pointer-events-none absolute inset-0 squad-pitch-lines" />

      <div className="relative space-y-3">
        {ROWS.map(({ pos }) => (
          <div key={pos} className="flex justify-center gap-1.5 sm:gap-2">
            {Array.from({ length: slotCounts[pos] }).map((_, index) => {
              const slotKey = `${pos}-${index}`;
              const playerId = starterSlotMap[slotKey];
              const player = playerId ? playersById.get(playerId) : null;

              if (player) {
                return (
                  <div
                    key={slotKey}
                    onDragOver={(e) => {
                      onDragOver(e);
                      setDragOverKey(slotKey);
                    }}
                    onDragLeave={() =>
                      setDragOverKey((k) => (k === slotKey ? null : k))
                    }
                    onDrop={(e) => {
                      setDragOverKey(null);
                      onDropOnSlot(e, slotKey, pos);
                    }}
                    className={
                      dragOverKey === slotKey
                        ? "rounded-lg ring-2 ring-cyan-400/60"
                        : undefined
                    }
                  >
                    <PitchPlayerCard
                      player={player as Player & { equipo_real: string }}
                      isCaptain={player.id === captainId}
                      draggable={!lineupLocked}
                      onDragStart={(e) =>
                        onDragStart(e, player.id, {
                          zone: "starter",
                          slotKey,
                        })
                      }
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
                  isDragOver={dragOverKey === slotKey}
                  onDragOver={(e) => {
                    onDragOver(e);
                    setDragOverKey(slotKey);
                  }}
                  onDragLeave={() =>
                    setDragOverKey((k) => (k === slotKey ? null : k))
                  }
                  onDrop={(e) => {
                    setDragOverKey(null);
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
