import type { Player, Position, PositionCounts, Rarity } from "@/lib/game/types";
import {
  pickWeightedPosition,
  pickWeightedRarity,
} from "@/lib/game/scouting";
import { MAX_SQUAD, SQUAD_POSITION_CAPS } from "@/lib/game/squad-limits";
import type { RNG } from "@/lib/game/rng";
import { createMathRng } from "@/lib/game/rng";
import type { SupabaseClient } from "@supabase/supabase-js";

const SCOUTING_COLUMNS =
  "id, nombre, posicion, rareza, costo_base, equipo_real, photo_url, api_football_id, performance_score";

export function isApiPlayer(player: Pick<Player, "api_football_id">): boolean {
  return player.api_football_id != null;
}

/** Full catalog — avoid on interactive paths; prefer pickScoutingPlayerFromDb. */
export async function fetchApiPlayersMaster(
  supabase: SupabaseClient
): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players_master")
    .select(SCOUTING_COLUMNS)
    .not("api_football_id", "is", null);

  if (error) {
    console.error("players_master API query failed:", error.message);
    return [];
  }

  return (data ?? []) as Player[];
}

export async function getAvailableApiPlayerPool(
  supabase: SupabaseClient,
  roster: Player[]
): Promise<Player[]> {
  const rosterIds = new Set(roster.map((p) => p.id));
  const apiPlayers = await fetchApiPlayersMaster(supabase);
  return apiPlayers.filter((p) => !rosterIds.has(p.id));
}

function excludeFilter(rosterIds: string[]): string | null {
  if (rosterIds.length === 0) return null;
  return `(${rosterIds.join(",")})`;
}

async function queryCandidates(
  supabase: SupabaseClient,
  opts: {
    rareza?: Rarity;
    posicion?: Position | null;
    minRarityIndex?: number;
    excludeIds: string[];
    limit: number;
  }
): Promise<Player[]> {
  const order: Rarity[] = ["bronce", "plata", "oro", "leyenda"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("players_master")
    .select(SCOUTING_COLUMNS)
    .not("api_football_id", "is", null)
    .limit(opts.limit);

  if (opts.rareza) {
    query = query.eq("rareza", opts.rareza);
  } else if (opts.minRarityIndex != null && opts.minRarityIndex > 0) {
    const allowed = order.slice(opts.minRarityIndex);
    query = query.in("rareza", allowed);
  }

  if (opts.posicion) {
    query = query.eq("posicion", opts.posicion);
  }

  const excl = excludeFilter(opts.excludeIds);
  if (excl) {
    query = query.not("id", "in", excl);
  }

  const { data, error } = await query;
  if (error) {
    console.error("scouting candidate query failed:", error.message);
    return [];
  }
  return (data ?? []) as Player[];
}

/**
 * Pick one scouting player with targeted queries (no full 700+ row download).
 */
export async function pickScoutingPlayerFromDb(
  supabase: SupabaseClient,
  roster: Player[],
  rosterCounts: PositionCounts,
  scoutingNivel: number,
  rng: RNG = createMathRng(),
  options?: { minRarity?: Rarity | null }
): Promise<Player | null> {
  const rosterSize =
    rosterCounts.GK +
    rosterCounts.DEF +
    rosterCounts.MED +
    rosterCounts.DEL;
  if (rosterSize >= MAX_SQUAD) return null;

  const excludeIds = roster.map((p) => p.id);
  const order: Rarity[] = ["bronce", "plata", "oro", "leyenda"];

  let targetRarity = pickWeightedRarity(scoutingNivel, rng);
  if (options?.minRarity === "oro" || options?.minRarity === "leyenda") {
    const minIndex = order.indexOf(options.minRarity);
    if (order.indexOf(targetRarity) < minIndex) {
      targetRarity = options.minRarity;
    }
  }

  const targetPosition = pickWeightedPosition(rosterCounts, rng);

  const attempts: Array<{
    rareza?: Rarity;
    posicion?: Position | null;
    minRarityIndex?: number;
  }> = [
    { rareza: targetRarity, posicion: targetPosition },
    { rareza: targetRarity, posicion: null },
    {
      minRarityIndex:
        options?.minRarity === "oro" || options?.minRarity === "leyenda"
          ? order.indexOf(options.minRarity)
          : undefined,
      posicion: targetPosition,
    },
    {
      minRarityIndex:
        options?.minRarity === "oro" || options?.minRarity === "leyenda"
          ? order.indexOf(options.minRarity)
          : undefined,
      posicion: null,
    },
    { posicion: targetPosition },
    {},
  ];

  for (const attempt of attempts) {
    const candidates = await queryCandidates(supabase, {
      ...attempt,
      excludeIds,
      limit: 80,
    });
    const eligible = candidates.filter(
      (p) => rosterCounts[p.posicion] < SQUAD_POSITION_CAPS[p.posicion]
    );
    if (eligible.length === 0) continue;
    return eligible[Math.floor(rng.next() * eligible.length)] ?? null;
  }

  return null;
}
