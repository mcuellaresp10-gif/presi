import { getFormationSlots } from "./formation";
import type { Player, Position } from "./types";

export type LineupDragSource =
  | { zone: "starter"; slotKey: string }
  | { zone: "bench"; index: number }
  | { zone: "reserve" };

export type LineupDropTarget =
  | { zone: "starter"; slotKey: string; position: Position }
  | { zone: "bench"; index: number }
  | { zone: "reserve" };

export const LINEUP_DRAG_MIME = "application/x-presi-lineup";

export function getStarterSlotKeys(formation: string): {
  key: string;
  position: Position;
}[] {
  const slots = getFormationSlots(formation);
  const keys: { key: string; position: Position }[] = [];
  const positions: Position[] = ["GK", "DEF", "MED", "DEL"];
  for (const pos of positions) {
    for (let i = 0; i < slots[pos]; i++) {
      keys.push({ key: `${pos}-${i}`, position: pos });
    }
  }
  return keys;
}

export function buildEmptyStarterSlotMap(
  formation: string
): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const { key } of getStarterSlotKeys(formation)) {
    map[key] = null;
  }
  return map;
}

export function normalizeStarterSlotMap(
  formation: string,
  map: Record<string, string | null> | null | undefined
): Record<string, string | null> {
  const base = buildEmptyStarterSlotMap(formation);
  if (!map) return base;
  for (const key of Object.keys(base)) {
    base[key] = map[key] ?? null;
  }
  return base;
}

export function buildStarterSlotMapFromIds(
  formation: string,
  starterIds: string[],
  playersById: Map<string, Player> | null | undefined
): Record<string, string | null> {
  const map = buildEmptyStarterSlotMap(formation);
  if (!playersById) return map;

  const starters = starterIds
    .map((id) => playersById.get(id))
    .filter((p): p is Player => !!p);

  const byPos: Record<Position, Player[]> = {
    GK: [],
    DEF: [],
    MED: [],
    DEL: [],
  };
  for (const p of starters) {
    byPos[p.posicion].push(p);
  }
  for (const pos of Object.keys(byPos) as Position[]) {
    byPos[pos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  const slotCounts = getFormationSlots(formation);
  for (const pos of Object.keys(slotCounts) as Position[]) {
    for (let i = 0; i < slotCounts[pos]; i++) {
      map[`${pos}-${i}`] = byPos[pos][i]?.id ?? null;
    }
  }
  return map;
}

export function starterIdsFromSlotMap(
  slotMap: Record<string, string | null>
): string[] {
  return Object.values(slotMap).filter((id): id is string => !!id);
}

export function benchIdsFromSlots(slots: (string | null)[]): string[] {
  return slots.filter((id): id is string => !!id);
}

export function slotKeyPosition(slotKey: string): Position {
  return slotKey.split("-")[0] as Position;
}

export function canPlacePlayerOnStarterSlot(
  player: Player,
  slotPosition: Position
): boolean {
  return player.posicion === slotPosition;
}

export function serializeLineupDrag(
  playerId: string,
  source: LineupDragSource
): string {
  return JSON.stringify({ playerId, source });
}

export function parseLineupDrag(data: string): {
  playerId: string;
  source: LineupDragSource;
} | null {
  try {
    const parsed = JSON.parse(data) as {
      playerId?: string;
      source?: LineupDragSource;
    };
    if (!parsed.playerId || !parsed.source?.zone) return null;
    return { playerId: parsed.playerId, source: parsed.source };
  } catch {
    return null;
  }
}
