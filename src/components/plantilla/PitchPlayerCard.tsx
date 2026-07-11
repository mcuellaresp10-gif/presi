"use client";

import { ClubKitRenderer } from "@/components/escudo/ClubKitRenderer";
import { cn } from "@/lib/utils";
import {
  getPlayerRating,
  getPlayerSurname,
  POSITION_PITCH_COLOR,
  POSITION_SHORT,
} from "@/lib/game/player-display";
import type { LineupDragSource } from "@/lib/game/lineup-slots";
import type { EscudoConfig, Position, RosterPlayer } from "@/lib/game/types";
import { isContractExpiringSoon } from "@/lib/game";

export function PitchPlayerCard({
  player,
  escudoConfig,
  onClick,
  size = "md",
  isCaptain = false,
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: {
  player: RosterPlayer;
  escudoConfig?: EscudoConfig | null;
  onClick?: () => void;
  size?: "sm" | "md";
  isCaptain?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}) {
  const rating = getPlayerRating(player);
  const surname = getPlayerSurname(player.nombre);
  const pos = player.posicion as Position;
  const jornadas = player.jornadas_restantes ?? 99;
  const expiringSoon = !player.es_prestamo && isContractExpiringSoon(jornadas);
  const loanJornadas = player.prestamo_jornadas_restantes ?? 0;
  const cardWidth = size === "sm" ? "w-[4.25rem]" : "w-[4.75rem]";
  const kitSize = size === "sm" ? 40 : 48;

  return (
    <div
      draggable={draggable && !isDragging}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group flex flex-col items-center text-center transition-transform outline-none",
        draggable && "cursor-grab touch-manipulation active:cursor-grabbing",
        onClick && "cursor-pointer",
        isDragging && "scale-95 opacity-50",
        cardWidth
      )}
    >
      <div className="relative">
        <ClubKitRenderer config={escudoConfig} size={kitSize} />

        <div className="absolute -right-0.5 -top-0.5 flex flex-col items-end gap-0.5">
          {isCaptain ? (
            <span
              className="rounded bg-amber-400 px-1 text-[8px] font-black leading-none text-amber-950 ring-1 ring-amber-200"
              title="Capitán — puntos dobles"
            >
              C
            </span>
          ) : null}
          {player.es_prestamo ? (
            <span
              className="rounded bg-cyan-400/90 px-1 text-[7px] font-black leading-none text-cyan-950"
              title="Jugador en préstamo"
            >
              P
            </span>
          ) : null}
          {expiringSoon ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-amber-300 ring-1 ring-amber-100"
              title="Contrato por vencer"
            />
          ) : null}
        </div>
      </div>

      <div className="mt-0.5 w-full overflow-hidden rounded-t-sm bg-black/85 px-1 py-0.5 shadow ring-1 ring-white/10">
        <p className="truncate text-[9px] font-black uppercase tracking-wide text-white">
          {surname}
        </p>
      </div>
      <div
        className={cn(
          "flex w-full items-center justify-center gap-1 rounded-b-sm px-1 py-0.5 text-[8px] font-black shadow",
          POSITION_PITCH_COLOR[pos]
        )}
      >
        <span>{POSITION_SHORT[pos]}</span>
        <span className="opacity-80">·</span>
        <span>{rating}</span>
      </div>

      <span className="mt-0.5 max-w-full truncate text-[7px] font-semibold uppercase tracking-wide text-white/80">
        {player.es_prestamo
          ? `Préstamo ${loanJornadas}J`
          : (player.equipo_real ?? "—").split(" ").slice(0, 2).join(" ")}
      </span>
    </div>
  );
}

export function PitchEmptySlot({
  position,
  slotKey,
  isDropTarget = false,
  isDragOver = false,
  isValidDrop = true,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  position: Position;
  onClick?: () => void;
  slotKey?: string;
  isDropTarget?: boolean;
  isDragOver?: boolean;
  isValidDrop?: boolean;
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
        "flex w-[4.75rem] flex-col items-center rounded-lg transition-colors",
        isDropTarget &&
          isDragOver &&
          isValidDrop &&
          "bg-presi-cyan/20 ring-2 ring-presi-cyan/60",
        isDropTarget &&
          isDragOver &&
          !isValidDrop &&
          "bg-presi-red/15 ring-2 ring-presi-red/50"
      )}
    >
      <div
        className={cn(
          "flex h-[5.5rem] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white/5",
          isDropTarget && isDragOver && isValidDrop
            ? "border-presi-cyan/70"
            : isDropTarget && isDragOver && !isValidDrop
              ? "border-presi-red/60"
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
          {isDropTarget && isDragOver
            ? isValidDrop
              ? "Soltar"
              : "No encaja"
            : "Vacío"}
        </span>
      </div>
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
