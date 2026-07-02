"use client";

import { cn } from "@/lib/utils";
import { PlayerPhoto } from "@/components/plantilla/PlayerPhoto";
import {
  getPlayerRating,
  getPlayerSurname,
  POSITION_PITCH_COLOR,
  POSITION_SHORT,
} from "@/lib/game/player-display";
import type { LineupDragSource } from "@/lib/game/lineup-slots";
import type { Position, RosterPlayer } from "@/lib/game/types";
import { isContractExpiringSoon } from "@/lib/game";

export function PitchPlayerCard({
  player,
  onClick,
  size = "md",
  isCaptain = false,
  draggable = false,
  onDragStart,
  isDragging = false,
}: {
  player: RosterPlayer;
  onClick?: () => void;
  size?: "sm" | "md";
  isCaptain?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}) {
  const rating = getPlayerRating(player);
  const surname = getPlayerSurname(player.nombre);
  const pos = player.posicion as Position;
  const jornadas = player.jornadas_restantes ?? 99;
  const expiringSoon = isContractExpiringSoon(jornadas);
  const cardWidth = size === "sm" ? "w-[4.5rem]" : "w-[5rem]";
  const cardHeight = size === "sm" ? "h-[7rem]" : "h-[7.5rem]";

  return (
    <div
      draggable={draggable && !isDragging}
      onDragStart={onDragStart}
      className={cn(
        "group flex flex-col items-center text-center transition-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "scale-95 opacity-50",
        cardWidth
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col items-center text-center active:scale-95"
      >
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-lg border border-white/15 shadow-lg",
            cardHeight,
            draggable && "ring-0 ring-cyan-400/0 group-hover:ring-2 group-hover:ring-cyan-400/40"
          )}
        >
          <div className="absolute inset-0">
            <div className="relative h-full w-full">
              <PlayerPhoto
                nombre={player.nombre}
                photoUrl={player.photo_url}
                sizes={size === "sm" ? "72px" : "80px"}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />
          </div>

          <div
            className={cn(
              "relative z-10 flex items-start justify-between px-1.5 py-1",
              POSITION_PITCH_COLOR[pos]
            )}
          >
            <span className="text-sm font-black leading-none drop-shadow">
              {rating}
            </span>
            <div className="flex items-center gap-0.5">
              {isCaptain && (
                <span
                  className="rounded bg-amber-400 px-1 text-[8px] font-black leading-none text-amber-950 ring-1 ring-amber-200"
                  title="Capitán — puntos dobles"
                >
                  C
                </span>
              )}
              {expiringSoon && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 ring-1 ring-amber-100" />
              )}
              <span className="text-[9px] font-bold leading-none">
                {POSITION_SHORT[pos]}
              </span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 px-1 pb-1 pt-6">
            <p className="truncate text-[9px] font-bold uppercase tracking-wide text-white drop-shadow">
              {surname}
            </p>
          </div>
        </div>

        <span className="mt-1 max-w-full truncate rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-medium uppercase text-white/60">
          {player.equipo_real.split(" ").slice(0, 2).join(" ")}
        </span>
      </button>
    </div>
  );
}

export function PitchEmptySlot({
  position,
  onClick,
  slotKey,
  isDropTarget = false,
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  position: Position;
  onClick?: () => void;
  slotKey?: string;
  isDropTarget?: boolean;
  isDragOver?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  return (
    <div
      data-slot-key={slotKey}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex w-[5rem] flex-col items-center rounded-lg transition-colors",
        isDropTarget && isDragOver && "bg-cyan-400/20 ring-2 ring-cyan-400/60"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col items-center"
      >
        <div
          className={cn(
            "flex h-[7.5rem] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white/5",
            isDropTarget && isDragOver
              ? "border-cyan-400/70"
              : "border-white/25"
          )}
        >
          <span
            className={cn(
              "mb-1 rounded px-1.5 py-0.5 text-[9px] font-bold",
              POSITION_PITCH_COLOR[position]
            )}
          >
            {POSITION_SHORT[position]}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
            {isDropTarget && isDragOver ? "Soltar" : "Vacío"}
          </span>
        </div>
      </button>
    </div>
  );
}

export function makeDragSource(
  zone: LineupDragSource["zone"],
  slotKey?: string,
  benchIndex?: number
): LineupDragSource {
  if (zone === "starter" && slotKey) return { zone: "starter", slotKey };
  if (zone === "bench" && benchIndex !== undefined) {
    return { zone: "bench", index: benchIndex };
  }
  return { zone: "reserve" };
}
