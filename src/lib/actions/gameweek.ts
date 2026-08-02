"use server";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getUserClub } from "@/lib/actions/club";
import {
  DEFAULT_SEASON,
  isApiFootballConfigured,
} from "@/lib/api-football/client";
import {
  ensureOpenGameweek,
  runGameweekStatusTick,
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

/**
 * Jornada cuyos puntos deben mostrarse en el VS del inicio:
 * en vivo, o la última finalizada (no la próxima upcoming).
 */
export async function getPointsGameweek(): Promise<GameweekPublic | null> {
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

  const finished = withPhase.filter((item) => item.phase === "finished");
  if (finished.length) {
    finished.sort(
      (a, b) =>
        new Date(a.row.last_kickoff_at ?? a.row.first_kickoff_at).getTime() -
        new Date(b.row.last_kickoff_at ?? b.row.first_kickoff_at).getTime()
    );
    return mapGameweek(finished[finished.length - 1]!.row, now);
  }

  return null;
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
  // Rare path: no upcoming GW in DB — one calendar pull so the user can save.
  await ensureOpenGameweek(supabase, { allowApiSync: true });

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

/** @deprecated Prefer cron `/api/cron/gameweek`; kept for manual/admin use. */
export async function repairStaleCalendar() {
  return repairCalendarIfStale();
}

export async function isGameweekEditable(
  gameweek: GameweekPublic,
  clubId: string
): Promise<boolean> {
  void clubId;
  const kickoffMs = new Date(gameweek.firstKickoffAt).getTime();
  return Date.now() < kickoffMs;
}

export const getPlantillaLineupState = cache(async function getPlantillaLineupState() {
  const club = await getUserClub();
  if (!club) return null;

  const [currentGameweek, editingGameweek] = await Promise.all([
    getCurrentGameweek(),
    getEditableGameweek(),
  ]);
  const isLineupLocked = computeIsLineupLocked(
    editingGameweek,
    currentGameweek
  );

  const effectiveEditing = editingGameweek ?? currentGameweek;
  const draft = effectiveEditing
    ? await getLineupDraftForClub(effectiveEditing.id)
    : null;

  if (!editingGameweek) {
    return {
      currentGameweek,
      editingGameweek: currentGameweek,
      isLineupLocked,
      deadlineAt: currentGameweek?.firstKickoffAt ?? null,
      displayRound: currentGameweek?.round ?? null,
      editingRound: currentGameweek?.round ?? null,
      draft,
    };
  }

  return {
    currentGameweek,
    editingGameweek,
    isLineupLocked,
    deadlineAt: editingGameweek.firstKickoffAt,
    displayRound: currentGameweek?.round ?? editingGameweek.round,
    editingRound: editingGameweek.round,
    draft,
  };
});

export const getClubGameweekSummary = cache(async function getClubGameweekSummary() {
  // Calendar repair is cron-only (solution #3) — never block home SSR.
  const club = await getUserClub();
  if (!club) return null;

  const [gameweek, nextGameweek, editableGameweek, pointsGameweekRaw] =
    await Promise.all([
      getCurrentGameweek(),
      getNextGameweek(),
      getEditableGameweek(),
      getPointsGameweek(),
    ]);

  const displayGameweek =
    gameweek?.status === "live"
      ? gameweek
      : (nextGameweek ?? gameweek);

  const deadlineGameweek = nextGameweek ?? editableGameweek ?? gameweek;

  if (!displayGameweek && !pointsGameweekRaw) {
    return {
      gameweek: null,
      displayGameweek: null,
      pointsGameweek: null,
      deadlineAt: null,
      gameweekPoints: 0,
      seasonPoints: 0,
      isLineupLocked: false,
      hasValidDraft: false,
      gameweekId: null,
    };
  }

  const supabase = await createClient();
  const draftGameweekId =
    editableGameweek?.id ?? displayGameweek?.id ?? pointsGameweekRaw!.id;
  const pointsGameweek = pointsGameweekRaw ?? displayGameweek!;
  const pointsGameweekId = pointsGameweek.id;

  const seasonForTotals =
    pointsGameweek.season ?? displayGameweek?.season ?? DEFAULT_SEASON;

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
        .eq("season", seasonForTotals)
        .maybeSingle(),
    ]);

  const isLineupLocked = computeIsLineupLocked(editableGameweek, gameweek);

  return {
    gameweek,
    displayGameweek: displayGameweek ?? pointsGameweek,
    /** Gameweek whose points are shown in the home VS (live or last finished). */
    pointsGameweek,
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
    gameweekId: pointsGameweekId,
  };
});

/**
 * Total points each player has contributed to the club this season.
 * Fast path: club rows only + season filter in memory (no heavy join).
 */
export async function getClubPlayerSeasonPoints(
  season: number = DEFAULT_SEASON
): Promise<Record<string, number>> {
  const club = await getUserClub();
  if (!club) return {};

  const supabase = await createClient();
  const [{ data: gwRows }, { data: pointRows, error }] = await Promise.all([
    supabase.from("gameweeks").select("id").eq("season", season),
    supabase
      .from("club_gameweek_points")
      .select("gameweek_id, breakdown")
      .eq("club_id", club.id),
  ]);

  if (error) {
    console.error("getClubPlayerSeasonPoints failed:", error.message);
    return {};
  }

  const seasonGwIds = new Set((gwRows ?? []).map((g) => g.id as string));
  const totals: Record<string, number> = {};

  for (const row of pointRows ?? []) {
    if (!seasonGwIds.has(row.gameweek_id as string)) continue;
    const breakdown = row.breakdown;
    if (!Array.isArray(breakdown)) continue;
    for (const entry of breakdown as Array<{
      playerId?: string;
      points?: number;
    }>) {
      if (!entry?.playerId || typeof entry.points !== "number") continue;
      totals[entry.playerId] = (totals[entry.playerId] ?? 0) + entry.points;
    }
  }
  return totals;
}

/** Read jornada points for one or more clubs (home VS / live poll). */
export async function getClubsGameweekPoints(
  gameweekId: string,
  clubIds: string[]
): Promise<Record<string, number>> {
  const ids = Array.from(new Set(clubIds.filter(Boolean)));
  if (!gameweekId || ids.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from("club_gameweek_points")
    .select("club_id, points")
    .eq("gameweek_id", gameweekId)
    .in("club_id", ids);

  const out: Record<string, number> = {};
  for (const id of ids) out[id] = 0;
  for (const row of data ?? []) {
    out[row.club_id as string] = Number(row.points) || 0;
  }
  return out;
}
export async function triggerGameweekSync() {
  try {
    const supabase = createServiceRoleClient();
    // NEVER run syncLiveStatsFromApi / points from the browser.
    // Those POSTs were taking 10+ minutes and blocking Plantilla navigation.
    // Full live scoring → /api/cron/gameweek only.
    await runGameweekStatusTick(supabase);
    return { ok: true as const, skipped: false as const, reason: "status_only" };
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
