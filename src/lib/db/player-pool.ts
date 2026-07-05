import type { Player } from "@/lib/game/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function isApiPlayer(player: Pick<Player, "api_football_id">): boolean {
  return player.api_football_id != null;
}

export async function fetchApiPlayersMaster(
  supabase: SupabaseClient
): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players_master")
    .select("*")
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
