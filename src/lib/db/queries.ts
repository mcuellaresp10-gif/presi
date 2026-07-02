import {
  calculateRosterCost,
  groupByPosition,
  INITIAL_BUDGET,
} from "@/lib/game";
import type { RosterPlayer } from "@/lib/game/types";
import { expireRosterContracts } from "@/lib/actions/contracts";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";

export async function getClubRoster() {
  const club = await getUserClub();
  if (!club) return null;

  await expireRosterContracts(club.id);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("club_roster")
    .select("player_id, es_titular, squad_role, players_master(*)")
    .eq("club_id", club.id);

  if (error) {
    return {
      club,
      players: [],
      grouped: groupByPosition([]),
      usedBudget: 0,
      totalBudget: INITIAL_BUDGET,
      remainingBudget: Number(club.presupuesto),
    };
  }

  const players: RosterPlayer[] = (data ?? []).map((row) => ({
    ...(row.players_master as unknown as RosterPlayer),
    es_titular: row.es_titular,
    jornadas_restantes: 3,
    renovaciones: 0,
  }));

  return {
    club,
    players,
    grouped: groupByPosition(players),
    usedBudget: calculateRosterCost(players),
    totalBudget: INITIAL_BUDGET,
    remainingBudget: Number(club.presupuesto),
  };
}
