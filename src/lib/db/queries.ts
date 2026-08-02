import {
  calculateRosterCost,
  groupByPosition,
  INITIAL_BUDGET,
  isContractExpired,
} from "@/lib/game";
import type { RosterPlayer } from "@/lib/game/types";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";

function isRosterSlotActive(row: {
  es_prestamo?: boolean | null;
  jornadas_restantes?: number | null;
  prestamo_jornadas_restantes?: number | null;
}): boolean {
  if (row.es_prestamo) {
    return (row.prestamo_jornadas_restantes ?? 0) > 0;
  }
  return !isContractExpired(row.jornadas_restantes ?? 0);
}

/**
 * Club roster for SSR. Does NOT await contract/loan expiry writes —
 * those belong to gameweek/cron paths. Expired rows are filtered out here.
 */
export async function getClubRoster() {
  const club = await getUserClub();
  if (!club) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("club_roster")
    .select(
      "player_id, es_titular, squad_role, jornadas_restantes, renovaciones, es_prestamo, prestamo_jornadas_restantes, players_master(*)"
    )
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

  const players: RosterPlayer[] = (data ?? [])
    .filter(isRosterSlotActive)
    .map((row) => ({
      ...(row.players_master as unknown as RosterPlayer),
      es_titular: row.es_titular,
      jornadas_restantes: row.jornadas_restantes ?? 0,
      renovaciones: row.renovaciones ?? 0,
      es_prestamo: row.es_prestamo ?? false,
      prestamo_jornadas_restantes: row.prestamo_jornadas_restantes,
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
