import type { Player, Rarity } from "./types";
import { getOvrForScore } from "./player-rarity";
import { getFormationSlots } from "./formation";

const RARITY_OVR: Record<Rarity, [number, number]> = {
  bronce: [72, 76],
  plata: [77, 81],
  oro: [82, 86],
  leyenda: [87, 92],
};

export const POSITION_SHORT: Record<Player["posicion"], string> = {
  GK: "GK",
  DEF: "DF",
  MED: "MF",
  DEL: "FW",
};

export const POSITION_PITCH_COLOR: Record<Player["posicion"], string> = {
  GK: "bg-presi-warning text-presi-bg",
  DEF: "bg-presi-navy text-white",
  MED: "bg-presi-cyan/80 text-presi-bg",
  DEL: "bg-presi-gold text-presi-bg",
};

export function getPlayerRating(player: Player): number {
  if (player.performance_score != null && player.performance_score > 0) {
    return getOvrForScore(player.rareza, player.performance_score);
  }

  const [min, max] = RARITY_OVR[player.rareza];
  const hash = player.id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return min + (hash % (max - min + 1));
}

export function getPlayerSurname(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return parts[parts.length - 1]?.toUpperCase() ?? nombre.toUpperCase();
}

export function getPlayerInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return nombre.slice(0, 2).toUpperCase();
}

export function assignPlayersToPitchSlots(
  players: Player[],
  formationLabel: string
): Record<Player["posicion"], (Player | null)[]> {
  const slots = getFormationSlots(formationLabel);
  const byPos: Record<Player["posicion"], Player[]> = {
    GK: [],
    DEF: [],
    MED: [],
    DEL: [],
  };

  for (const player of players) {
    byPos[player.posicion].push(player);
  }

  for (const pos of Object.keys(byPos) as Player["posicion"][]) {
    byPos[pos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return {
    GK: padSlots(byPos.GK, slots.GK),
    DEF: padSlots(byPos.DEF, slots.DEF),
    MED: padSlots(byPos.MED, slots.MED),
    DEL: padSlots(byPos.DEL, slots.DEL),
  };
}

function padSlots(players: Player[], count: number): (Player | null)[] {
  const row: (Player | null)[] = players.slice(0, count);
  while (row.length < count) row.push(null);
  return row;
}
