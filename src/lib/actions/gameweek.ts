"use server";

import { cache } from "react";
import { revalidatePath, unstable_cache } from "next/cache";
import { getUserClub } from "@/lib/actions/club";
import { isApiFootballConfigured } from "@/lib/api-football/client";
import {
  ensureOpenGameweek,
  runPageLoadGameweekTick,
  syncCalendarFromApi,
} from "@/lib/gameweek/sync";
import { deriveGameweekStatus } from "@/lib/gameweek/status";
import {
  isCalendarStale,
  resolveNextGameweekRow,
} from "@/lib/gameweek/resolve-next";
import { computeIsLineupLocked } from "@/lib/gameweek/lineup-lock";
import { getActiveTournamentPhase } from "@/lib/gameweek/tournament";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export type GameweekPublic = {
  id: string;
  season: number;
  round: number;
  tournamentPhase: string;
  firstKickoffAt: string;
  lastKickoffAt: string | null;
  status: string;
};

export async function getCurrentGameweek(): Promise<GameweekPublic | null> {
  const supabase = await createClient();
  const now = new Date();
  const tournamentPhase = getActiveTournamentPhase(now);

  const { data: rows } = await supabase
    .from("gameweeks")
    .select("*")
    .eq("tournament_phase", tournamentPhase)
    .order("season", { ascending: false })
    .order("round", { ascending: true });

  if (!rows?.length) return null;

  const withPhase = rows.map((row) => ({
    row,
    phase: deriveGameweekStatus(
      row.first_kickoff_at,
      row.last_kickoff_at,
      now
    ),
  }));

  const live = withPhase.filter((item) => item.phase === "live");
  if (live.length) {
    return mapGameweek(live[live.length - 1]!.row, now);
  }

  const upcoming = withPhase.filter((item) => item.phase === "upcoming");
  if (upcoming.length) {
    upcoming.sort(
      (a, b) =>
        new Date(a.row.first_kickoff_at).getTime() -
        new Date(b.row.first_kickoff_at).getTime()
    );
    return mapGameweek(upcoming[0]!.row, now);
  }

  const finished = withPhase.filter((item) => item.phase === "finished");
  if (finished.length) {
    return mapGameweek(finished[finished.length - 1]!.row, now);
  }

  return mapGameweek(rows[rows.length - 1]!, now);
}

function mapGameweek(
  row: {
    id: string;
    season: number;
    round: number;
    tournament_phase?: string;
    first_kickoff_at: string;
    last_kickoff_at: string | null;
    status: string;
  },
  now: Date = new Date()
): GameweekPublic {
  return {
    id: row.id,
    season: row.season,
    round: row.round,
    tournamentPhase: row.tournament_phase ?? getActiveTournamentPhase(now),
    firstKickoffAt: row.first_kickoff_at,
    lastKickoffAt: row.last_kickoff_at,
    status: deriveGameweekStatus(
      row.first_kickoff_at,
      row.last_kickoff_at,
      now
    ),
  };
}

export async function getEditableGameweek(): Promise<GameweekPublic | null> {
  return getNextGameweek();
}

/** Próxima jornada del semestre activo según partidos reales en BD. */
export async function getNextGameweek(): Promise<GameweekPublic | null> {
  const supabase = await createClient();
  const now = new Date();
  const row = await resolveNextGameweekRow(supabase, now);
  return row ? mapGameweek(row, now) : null;
}

export async function resolveGameweekForDraftSave(): Promise<GameweekPublic | null> {
  const found = await findGameweekForDraftSave();
  if (found) return found;

  const supabase = createServiceRoleClient();
  await ensureOpenGameweek(supabase);

  return findGameweekForDraftSave();
}

export async function getGameweekById(
  id: string
): Promise<GameweekPublic | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gameweeks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ? mapGameweek(data) : null;
}

async function findGameweekForDraftSave(): Promise<GameweekPublic | null> {
  const supabase = await createClient();
  const now = new Date();
  const row = await resolveNextGameweekRow(supabase, now);
  if (row) return mapGameweek(row, now);

  const phase = getActiveTournamentPhase(now);
  const { data: rows } = await supabase
    .from("gameweeks")
    .select("*")
    .eq("tournament_phase", phase)
    .order("season", { ascending: false })
    .order("round", { ascending: true });

  for (const row of rows ?? []) {
    const gameweek = mapGameweek(row, now);
    if (gameweek.status === "upcoming") {
      return gameweek;
    }
  }

  return null;
}

const repairCalendarIfStale = unstable_cache(
  async () => {
    if (!isApiFootballConfigured()) return;
    const supabase = createServiceRoleClient();
    if (await isCalendarStale(supabase)) {
      await syncCalendarFromApi(supabase);
    }
  },
  ["presi-calendar-repair"],
  { revalidate: 3600 }
);

export async function isGameweekEditable(
  gameweek: GameweekPublic,
  clubId: string
): Promise<boolean> {
  void clubId;
  const kickoffMs = new Date(gameweek.firstKickoffAt).getTime();
  return Date.now() < kickoffMs;
}

export async function getPlantillaLineupState() {
  const club = await getUserClub();
  if (!club) return null;

  const currentGameweek = await getCurrentGameweek();
  const editingGameweek = await getEditableGameweek();
  const isLineupLocked = computeIsLineupLocked(
    editingGameweek,
    currentGameweek
  );

  if (!editingGameweek) {
    return {
      currentGameweek,
      editingGameweek: currentGameweek,
      isLineupLocked,
      deadlineAt: currentGameweek?.firstKickoffAt ?? null,
      displayRound: currentGameweek?.round ?? null,
      editingRound: currentGameweek?.round ?? null,
    };
  }

  return {
    currentGameweek,
    editingGameweek,
    isLineupLocked,
    deadlineAt: editingGameweek.firstKickoffAt,
    displayRound: currentGameweek?.round ?? editingGameweek.round,
    editingRound: editingGameweek.round,
  };
}

export const getClubGameweekSummary = cache(async function getClubGameweekSummary() {
  await repairCalendarIfStale();

  const club = await getUserClub();
  if (!club) return null;

  const [gameweek, nextGameweek, editableGameweek] = await Promise.all([
    getCurrentGameweek(),
    getNextGameweek(),
    getEditableGameweek(),
  ]);

  const displayGameweek =
    gameweek?.status === "live"
      ? gameweek
      : (nextGameweek ?? gameweek);

  const deadlineGameweek = nextGameweek ?? editableGameweek ?? gameweek;

  if (!displayGameweek) {
    return {
      gameweek: null,
      displayGameweek: null,
      deadlineAt: null,
      gameweekPoints: 0,
      seasonPoints: 0,
      isLineupLocked: false,
      hasValidDraft: false,
      gameweekId: null,
    };
  }

  const supabase = await createClient();
  const draftGameweekId = editableGameweek?.id ?? displayGameweek.id;
  const pointsGameweekId =
    gameweek?.status === "live" || gameweek?.status === "finished"
      ? gameweek.id
      : displayGameweek.id;

  const [{ data: snapshot }, { data: draft }, { data: gwPoints }, { data: seasonPoints }] =
    await Promise.all([
      supabase
        .from("lineup_snapshots")
        .select("is_valid")
        .eq("club_id", club.id)
        .eq("gameweek_id", draftGameweekId)
        .maybeSingle(),
      supabase
        .from("lineup_drafts")
        .select("starter_ids, bench_ids, captain_id")
        .eq("club_id", club.id)
        .eq("gameweek_id", draftGameweekId)
        .maybeSingle(),
      supabase
        .from("club_gameweek_points")
        .select("points")
        .eq("club_id", club.id)
        .eq("gameweek_id", pointsGameweekId)
        .maybeSingle(),
      supabase
        .from("club_season_points")
        .select("total_points")
        .eq("club_id", club.id)
        .eq("season", displayGameweek.season)
        .maybeSingle(),
    ]);

  const isLineupLocked = computeIsLineupLocked(editableGameweek, gameweek);

  return {
    gameweek,
    displayGameweek,
    deadlineAt: deadlineGameweek?.firstKickoffAt ?? null,
    gameweekPoints: Number(gwPoints?.points ?? 0),
    seasonPoints: Number(seasonPoints?.total_points ?? 0),
    isLineupLocked,
    hasValidDraft:
      !!draft &&
      draft.starter_ids?.length === 11 &&
      draft.bench_ids?.length === 5 &&
      !!draft.captain_id,
    snapshotValid: snapshot?.is_valid ?? false,
    gameweekId: displayGameweek.id,
  };
});

export async function triggerGameweekSync() {
  try {
    const supabase = createServiceRoleClient();
    if (process.env.API_FOOTBALL_KEY?.trim()) {
      await syncCalendarFromApi(supabase);
    }
    const result = await runPageLoadGameweekTick(supabase);
    revalidatePath("/inicio");
    revalidatePath("/ranking");
    revalidatePath("/calendario");
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
