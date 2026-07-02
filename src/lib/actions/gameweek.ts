"use server";

import { revalidatePath } from "next/cache";
import { getUserClub } from "@/lib/actions/club";
import { runPageLoadGameweekTick } from "@/lib/gameweek/sync";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export type GameweekPublic = {
  id: string;
  season: number;
  round: number;
  firstKickoffAt: string;
  lastKickoffAt: string | null;
  status: string;
};

export async function getCurrentGameweek(): Promise<GameweekPublic | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: live } = await supabase
    .from("gameweeks")
    .select("*")
    .eq("status", "live")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (live) {
    return mapGameweek(live);
  }

  const { data: upcoming } = await supabase
    .from("gameweeks")
    .select("*")
    .eq("status", "upcoming")
    .gte("first_kickoff_at", now)
    .order("first_kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (upcoming) return mapGameweek(upcoming);

  const { data: anyGw } = await supabase
    .from("gameweeks")
    .select("*")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();

  return anyGw ? mapGameweek(anyGw) : null;
}

function mapGameweek(row: {
  id: string;
  season: number;
  round: number;
  first_kickoff_at: string;
  last_kickoff_at: string | null;
  status: string;
}): GameweekPublic {
  return {
    id: row.id,
    season: row.season,
    round: row.round,
    firstKickoffAt: row.first_kickoff_at,
    lastKickoffAt: row.last_kickoff_at,
    status: row.status,
  };
}

export async function getClubGameweekSummary() {
  const club = await getUserClub();
  if (!club) return null;

  const gameweek = await getCurrentGameweek();
  if (!gameweek) {
    return {
      gameweek: null,
      gameweekPoints: 0,
      seasonPoints: 0,
      isLineupLocked: false,
      hasValidDraft: false,
      gameweekId: null,
    };
  }

  const supabase = await createClient();
  const now = Date.now();
  const lockedByTime = now >= new Date(gameweek.firstKickoffAt).getTime();

  const { data: snapshot } = await supabase
    .from("lineup_snapshots")
    .select("is_valid")
    .eq("club_id", club.id)
    .eq("gameweek_id", gameweek.id)
    .maybeSingle();

  const { data: draft } = await supabase
    .from("lineup_drafts")
    .select("starter_ids, bench_ids")
    .eq("club_id", club.id)
    .eq("gameweek_id", gameweek.id)
    .maybeSingle();

  const { data: gwPoints } = await supabase
    .from("club_gameweek_points")
    .select("points")
    .eq("club_id", club.id)
    .eq("gameweek_id", gameweek.id)
    .maybeSingle();

  const { data: seasonPoints } = await supabase
    .from("club_season_points")
    .select("total_points")
    .eq("club_id", club.id)
    .eq("season", gameweek.season)
    .maybeSingle();

  return {
    gameweek,
    gameweekPoints: Number(gwPoints?.points ?? 0),
    seasonPoints: Number(seasonPoints?.total_points ?? 0),
    isLineupLocked: lockedByTime || !!snapshot,
    hasValidDraft:
      !!draft &&
      draft.starter_ids?.length === 11 &&
      draft.bench_ids?.length === 5,
    snapshotValid: snapshot?.is_valid ?? false,
    gameweekId: gameweek.id,
  };
}

export async function triggerGameweekSync() {
  try {
    const supabase = createServiceRoleClient();
    const result = await runPageLoadGameweekTick(supabase);
    revalidatePath("/inicio");
    revalidatePath("/plantilla");
    revalidatePath("/ranking");
    return result;
  } catch (error) {
    console.error("gameweek sync skipped:", error);
    return { ok: false, skipped: true, reason: "error" };
  }
}

export async function getGameweekPointsBreakdown(gameweekId: string) {
  const club = await getUserClub();
  if (!club) return null;

  const supabase = await createClient();
  const { data: gwPoints } = await supabase
    .from("club_gameweek_points")
    .select("points, breakdown")
    .eq("club_id", club.id)
    .eq("gameweek_id", gameweekId)
    .maybeSingle();

  if (!gwPoints?.breakdown) {
    return { totalPoints: Number(gwPoints?.points ?? 0), players: [] };
  }

  const breakdown = gwPoints.breakdown as Array<{
    playerId: string;
    points: number;
    source: "starter" | "bench_sub" | "bench_boost";
    minutes: number;
    isCaptain?: boolean;
    lines?: Array<{ id: string; label: string; count: number; points: number }>;
  }>;

  const playerIds = breakdown.map((row) => row.playerId);
  const { data: players } = await supabase
    .from("players_master")
    .select("id, nombre, posicion, photo_url, equipo_real")
    .in("id", playerIds.length ? playerIds : ["00000000-0000-0000-0000-000000000000"]);

  const byId = new Map(
    (players ?? []).map((p) => [p.id, p])
  );

  const enriched = breakdown
    .slice()
    .sort((a, b) => b.points - a.points)
    .map((row) => ({
      ...row,
      player: byId.get(row.playerId) ?? undefined,
    }));

  return {
    totalPoints: Number(gwPoints.points ?? 0),
    players: enriched,
  };
}

export async function getLineupDraftForClub(gameweekId: string) {
  const club = await getUserClub();
  if (!club) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("lineup_drafts")
    .select("*")
    .eq("club_id", club.id)
    .eq("gameweek_id", gameweekId)
    .maybeSingle();

  if (!data) return null;

  return {
    starterIds: data.starter_ids as string[],
    benchIds: data.bench_ids as string[],
    captainId: (data.captain_id as string | null) ?? null,
    formation: data.formation as string | null,
  };
}
