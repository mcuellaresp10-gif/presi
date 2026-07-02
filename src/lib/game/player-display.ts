import type { Player, Position, Rarity } from "./types";
import { getFormationSlots } from "./formation";

const RARITY_OVR: Record<Rarity, [number, number]> = {
  bronce: [72, 76],
  plata: [77, 81],
  oro: [82, 86],
  leyenda: [87, 92],
};

export const POSITION_SHORT: Record<Position, string> = {
  GK: "GK",
  DEF: "DF",
  MED: "MF",
  DEL: "FW",
};

export const POSITION_PITCH_COLOR: Record<Position, string> = {
  GK: "bg-amber-400 text-andes-deep",
  DEF: "bg-violet-400 text-white",
  MED: "bg-sky-400 text-andes-deep",
  DEL: "bg-emerald-400 text-andes-deep",
};

export function getPlayerRating(player: Player): number {
  const [min, max] = RARITY_OVR[player.rareza];
  const hash = player.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
): Record<Position, (Player | null)[]> {
  const slots = getFormationSlots(formationLabel);
  const byPos: Record<Position, Player[]> = {
    GK: [],
    DEF: [],
    MED: [],
    DEL: [],
  };

  for (const player of players) {
    byPos[player.posicion].push(player);
  }

  for (const pos of Object.keys(byPos) as Position[]) {
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
