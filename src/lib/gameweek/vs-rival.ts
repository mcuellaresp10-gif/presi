import { DEFAULT_SEASON } from "@/lib/api-football/client";
import { NPC_CLUB_ESTILO } from "@/lib/game/npc";
import {
  resolveRivalClubId,
  type RankingClub,
} from "@/lib/game/vs-rewards";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Build season ranking (same sort as getGlobalRanking) for VS rival snapshot. */
export async function loadSeasonRankingForVs(
  supabase: SupabaseClient,
  season = DEFAULT_SEASON
): Promise<RankingClub[]> {
  const [{ data: clubs }, { data: pointsRows }] = await Promise.all([
    supabase
      .from("clubs")
      .select("id, nombre, estilo")
      .eq("onboarding_completado", true),
    supabase
      .from("club_season_points")
      .select("club_id, total_points")
      .eq("season", season),
  ]);

  const pointsByClub = new Map<string, number>();
  for (const row of pointsRows ?? []) {
    pointsByClub.set(row.club_id as string, Number(row.total_points) || 0);
  }

  return (clubs ?? [])
    .map((row) => ({
      id: row.id as string,
      nombre: row.nombre as string,
      puntos: pointsByClub.get(row.id as string) ?? 0,
      estilo: (row as { estilo?: string | null }).estilo ?? null,
    }))
    .sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      return a.nombre.localeCompare(b.nombre, "es");
    });
}

export async function snapshotVsRivalsForGameweek(
  supabase: SupabaseClient,
  gameweekId: string
) {
  const ranked = await loadSeasonRankingForVs(supabase);
  if (ranked.length < 2) return { snapshotted: 0 };

  let snapshotted = 0;
  for (const club of ranked) {
    const { data: existing } = await supabase
      .from("club_gameweek_vs")
      .select("club_id")
      .eq("club_id", club.id)
      .eq("gameweek_id", gameweekId)
      .maybeSingle();
    if (existing) continue;

    const rivalId = resolveRivalClubId(ranked, club.id);
    const { error } = await supabase.from("club_gameweek_vs").insert({
      club_id: club.id,
      gameweek_id: gameweekId,
      rival_club_id: rivalId,
    });
    if (!error) snapshotted += 1;
  }

  return { snapshotted };
}

export function isNpcClubEstilo(estilo: string | null | undefined): boolean {
  return estilo === NPC_CLUB_ESTILO;
}
