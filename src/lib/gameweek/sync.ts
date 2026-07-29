import {
  DEFAULT_LEAGUE_ID,
  DEFAULT_SEASON,
  fetchFixturePlayerStats,
  fetchLeagueFixtures,
  fetchLeaguePlayersPage,
  isApiFootballConfigured,
  mapApiPosition,
} from "@/lib/api-football/client";
import { mapApiPlayerStatRow } from "@/lib/api-football/map-stats";
import { buildTierAssignmentsFromApiRows } from "@/lib/game/player-rarity";
import {
  buildGameweekGroupsFromFixtures,
  getActiveTournamentPhase,
  type TournamentPhase,
} from "@/lib/gameweek/tournament";
import {
  processGameweekPointsAndContracts,
  tickGameweekStatuses,
} from "@/lib/gameweek/processor";
import {
  deriveGameweekStatus,
  isGameweekScoreable,
} from "@/lib/gameweek/status";
import { isFixtureFinished, isFixtureLive } from "@/lib/gameweek/format";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Full league catalog sync + rarity re-tier from API-Football.
 * Call from /api/cron/players (weekly) or scripts/evaluate-player-tiers.mjs --apply —
 * never from the page-load path (too slow).
 */
export async function syncPlayersFromApi(
  supabase: SupabaseClient,
  leagueId = DEFAULT_LEAGUE_ID,
  season = DEFAULT_SEASON
) {
  if (!isApiFootballConfigured()) {
    return { synced: 0, mode: "skip" as const };
  }

  const allRows = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const { players, paging } = await fetchLeaguePlayersPage(
      leagueId,
      season,
      page
    );
    if (!players.length) break;
    allRows.push(...players);
    totalPages = paging.total;
    page += 1;
  }

  const assignments = buildTierAssignmentsFromApiRows(
    allRows,
    leagueId,
    mapApiPosition
  );
  const now = new Date().toISOString();
  let synced = 0;

  for (const player of Array.from(assignments.values())) {
    const { data: existing } = await supabase
      .from("players_master")
      .select("id")
      .eq("api_football_id", player.apiFootballId)
      .maybeSingle();

    const payload = {
      nombre: player.nombre,
      equipo_real: player.equipo,
      posicion: player.posicion,
      rareza: player.rareza,
      costo_base: player.costo_base,
      performance_score: player.performance_score,
      stats_updated_at: now,
      photo_url: null,
      updated_at: now,
    };

    if (existing) {
      await supabase
        .from("players_master")
        .update(payload)
        .eq("id", existing.id);
    } else {
      await supabase.from("players_master").insert({
        api_football_id: player.apiFootballId,
        ...payload,
      });
    }
    synced += 1;
  }

  return { synced, mode: "api" as const };
}

/** Recalcula rareza/costo desde stats de liga (misma lógica que sync inicial). */
export async function reTierPlayersFromApi(
  supabase: SupabaseClient,
  leagueId = DEFAULT_LEAGUE_ID,
  season = DEFAULT_SEASON
) {
  return syncPlayersFromApi(supabase, leagueId, season);
}

export async function syncFixturesFromApi(
  supabase: SupabaseClient,
  leagueId = DEFAULT_LEAGUE_ID,
  season = DEFAULT_SEASON
) {
  if (!isApiFootballConfigured()) {
    return { mode: "skip" as const };
  }

  const fixtures = await fetchLeagueFixtures(leagueId, season);
  const groups = buildGameweekGroupsFromFixtures(fixtures);
  const syncedGameweekIds = new Set<string>();
  const syncedPhases = new Set<TournamentPhase>();

  for (const { phase, round, fixtures: roundFixtures } of groups) {
    syncedPhases.add(phase);
    const kickoffs = roundFixtures.map((f) =>
      new Date(f.fixture.date).getTime()
    );
    const firstKickoff = new Date(Math.min(...kickoffs));
    const lastKickoff = new Date(Math.max(...kickoffs));

    const derivedStatus = deriveGameweekStatus(firstKickoff, lastKickoff);

    const { data: gw } = await supabase
      .from("gameweeks")
      .upsert(
        {
          season,
          tournament_phase: phase,
          round,
          first_kickoff_at: firstKickoff.toISOString(),
          last_kickoff_at: lastKickoff.toISOString(),
          // Never force "upcoming" — that skipped scoring after every calendar sync.
          status: derivedStatus,
        },
        { onConflict: "season,tournament_phase,round" }
      )
      .select()
      .single();

    if (!gw) continue;
    syncedGameweekIds.add(gw.id);

    for (const f of roundFixtures) {
      if (!f?.fixture?.id) continue;

      await supabase.from("fixtures").upsert(
        {
          gameweek_id: gw.id,
          api_football_fixture_id: f.fixture.id,
          kickoff_at: f.fixture.date,
          home_team: f.teams?.home?.name ?? "Local",
          away_team: f.teams?.away?.name ?? "Visitante",
          home_goals: f.goals?.home ?? null,
          away_goals: f.goals?.away ?? null,
          status: f.fixture.status?.short ?? "NS",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "api_football_fixture_id" }
      );
    }
  }

  for (const phase of Array.from(syncedPhases)) {
    await pruneStaleGameweeks(supabase, season, phase, syncedGameweekIds);
  }

  return { mode: "api" as const, rounds: groups.length };
}

/** Elimina jornadas huérfanas tras re-numerar (p. ej. J20 fantasma en Clausura). */
async function pruneStaleGameweeks(
  supabase: SupabaseClient,
  season: number,
  phase: TournamentPhase,
  keepIds: Set<string>
) {
  const { data: rows } = await supabase
    .from("gameweeks")
    .select("id, round")
    .eq("season", season)
    .eq("tournament_phase", phase);

  const keepRows = (rows ?? []).filter((row) => keepIds.has(row.id));
  const targetId =
    keepRows.sort((a, b) => a.round - b.round)[0]?.id ?? null;

  for (const row of rows ?? []) {
    if (keepIds.has(row.id)) continue;

    if (targetId) {
      await supabase
        .from("lineup_drafts")
        .update({ gameweek_id: targetId })
        .eq("gameweek_id", row.id);
      await supabase
        .from("lineup_snapshots")
        .update({ gameweek_id: targetId })
        .eq("gameweek_id", row.id);
    }

    await supabase.from("fixtures").delete().eq("gameweek_id", row.id);
    await supabase.from("gameweeks").delete().eq("id", row.id);
  }
}

export async function syncCalendarFromApi(
  supabase: SupabaseClient,
  leagueId = DEFAULT_LEAGUE_ID,
  season = DEFAULT_SEASON
) {
  if (!isApiFootballConfigured()) {
    return { mode: "skip" as const };
  }

  const result = await syncFixturesFromApi(supabase, leagueId, season);
  await tickGameweekStatuses(supabase);
  return result;
}

/** Minimum gap between full season calendar syncs (cron). */
export const CALENDAR_SYNC_IDLE_MS = 60 * 60 * 1000;
/** While a gameweek is live, refresh fixtures more often for FT/goals. */
export const CALENDAR_SYNC_LIVE_MS = 15 * 60 * 1000;

/**
 * True if fixtures look stale enough to warrant another full calendar pull.
 * Uses latest fixtures.updated_at (only calendar sync bulk-touches that column).
 */
export async function shouldSyncCalendar(
  supabase: SupabaseClient,
  minIntervalMs: number
): Promise<boolean> {
  const { data } = await supabase
    .from("fixtures")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.updated_at) return true;
  return Date.now() - new Date(data.updated_at).getTime() >= minIntervalMs;
}

/**
 * Cron helper: full calendar at most hourly (15m while live), else status tick only.
 */
export async function syncCalendarIfDue(
  supabase: SupabaseClient,
  options: { force?: boolean } = {}
) {
  if (!isApiFootballConfigured()) {
    await tickGameweekStatuses(supabase);
    return { mode: "skip" as const, reason: "no_api_key" as const };
  }

  if (options.force) {
    const result = await syncCalendarFromApi(supabase);
    return { ...result, throttled: false as const };
  }

  const live = (await listLiveScoreableGameweeks(supabase)).length > 0;
  const interval = live ? CALENDAR_SYNC_LIVE_MS : CALENDAR_SYNC_IDLE_MS;

  if (!(await shouldSyncCalendar(supabase, interval))) {
    await tickGameweekStatuses(supabase);
    return {
      mode: "skip" as const,
      reason: "throttled" as const,
      throttled: true as const,
      intervalMs: interval,
    };
  }

  const result = await syncCalendarFromApi(supabase);
  return { ...result, throttled: false as const };
}

export async function listScoreableGameweeks(
  supabase: SupabaseClient,
  now = new Date()
): Promise<Array<{ id: string; status: "live" | "finished" }>> {
  // Use kickoff-derived status so a stale DB "upcoming" (or calendar
  // overwrite) still lets catch-up scoring run for live/recent GWs.
  const { data } = await supabase
    .from("gameweeks")
    .select("id, status, first_kickoff_at, last_kickoff_at");

  return (data ?? [])
    .map((gw) => {
      const derived = deriveGameweekStatus(
        gw.first_kickoff_at,
        gw.last_kickoff_at,
        now
      );
      return {
        id: gw.id as string,
        status: derived,
        first_kickoff_at: gw.first_kickoff_at as string,
        last_kickoff_at: gw.last_kickoff_at as string | null,
      };
    })
    .filter((gw) =>
      isGameweekScoreable(
        gw.status,
        gw.last_kickoff_at,
        gw.first_kickoff_at,
        now
      )
    )
    .filter(
      (gw): gw is typeof gw & { status: "live" | "finished" } =>
        gw.status === "live" || gw.status === "finished"
    )
    .map((gw) => ({ id: gw.id, status: gw.status }));
}

/** Only jornadas currently in the live window (for light page-load ticks). */
export async function listLiveScoreableGameweeks(
  supabase: SupabaseClient,
  now = new Date()
): Promise<Array<{ id: string }>> {
  return (await listScoreableGameweeks(supabase, now))
    .filter((gw) => gw.status === "live")
    .map((gw) => ({ id: gw.id }));
}

const STATS_FETCH_CONCURRENCY = 4;
const STATS_UPSERT_CHUNK = 120;
/** Re-fetch finished fixtures if their last stats sync is older than this. */
const FINISHED_STATS_STALE_MS = 6 * 60 * 60 * 1000;
const FIXTURE_SKIP_STATUSES = new Set([
  "PST",
  "CANC",
  "ABD",
  "AWD",
  "WO",
  "NS",
  "TBD",
  "SUSP",
]);

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (true) {
        const index = next++;
        if (index >= items.length) return;
        results[index] = await fn(items[index]!, index);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

async function loadApiFootballIdMap(
  supabase: SupabaseClient,
  apiIds: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const unique = Array.from(new Set(apiIds.filter((id) => Number.isFinite(id))));
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const { data } = await supabase
      .from("players_master")
      .select("id, api_football_id")
      .in("api_football_id", chunk);
    for (const row of data ?? []) {
      if (row.api_football_id != null) {
        map.set(Number(row.api_football_id), row.id as string);
      }
    }
  }
  return map;
}

type FixtureStatsRow = {
  id: string;
  api_football_fixture_id: number;
  gameweek_id: string;
  home_team: string;
  away_team: string;
  home_goals: number | null;
  away_goals: number | null;
  status: string;
};

export type SyncLiveStatsOptions = {
  /** When true, always re-fetch even if finished fixtures already have stats. */
  force?: boolean;
  concurrency?: number;
};

export async function syncLiveStatsFromApi(
  supabase: SupabaseClient,
  gameweekIds?: string[],
  options: SyncLiveStatsOptions = {}
) {
  if (!isApiFootballConfigured()) {
    return { mode: "skip" as const, fetched: 0, skipped: 0, upserted: 0 };
  }

  let targetIds = gameweekIds;
  if (!targetIds) {
    targetIds = (await listScoreableGameweeks(supabase)).map((g) => g.id);
  }
  if (targetIds.length === 0) {
    return { mode: "skip" as const, fetched: 0, skipped: 0, upserted: 0 };
  }

  const { data: fixtures } = await supabase
    .from("fixtures")
    .select(
      "id, api_football_fixture_id, gameweek_id, home_team, away_team, home_goals, away_goals, status"
    )
    .in("gameweek_id", targetIds);

  const allFixtures = (fixtures ?? []) as FixtureStatsRow[];
  if (allFixtures.length === 0) {
    return { mode: "api" as const, fetched: 0, skipped: 0, upserted: 0 };
  }

  const fixtureIds = allFixtures.map((f) => f.id);
  const { data: existingStats } = await supabase
    .from("player_match_stats")
    .select("fixture_id, updated_at")
    .in("fixture_id", fixtureIds);

  const latestByFixture = new Map<string, number>();
  for (const row of existingStats ?? []) {
    const ts = new Date(row.updated_at as string).getTime();
    const prev = latestByFixture.get(row.fixture_id as string) ?? 0;
    if (ts > prev) latestByFixture.set(row.fixture_id as string, ts);
  }

  const now = Date.now();
  const toFetch: FixtureStatsRow[] = [];
  let skipped = 0;

  for (const fixture of allFixtures) {
    if (FIXTURE_SKIP_STATUSES.has(fixture.status)) {
      skipped += 1;
      continue;
    }

    const finished = isFixtureFinished(fixture.status);
    const live = isFixtureLive(fixture.status);
    const lastSync = latestByFixture.get(fixture.id);

    if (!options.force && finished && lastSync != null) {
      // Finished match already scored recently — skip until stale.
      if (now - lastSync < FINISHED_STATS_STALE_MS) {
        skipped += 1;
        continue;
      }
    }

    // Not started / no useful window and not live/finished with data needed.
    if (!finished && !live && lastSync != null) {
      skipped += 1;
      continue;
    }

    toFetch.push(fixture);
  }

  const concurrency = options.concurrency ?? STATS_FETCH_CONCURRENCY;
  const fetchedBlocks = await mapPool(toFetch, concurrency, async (fixture) => {
    try {
      const stats = await fetchFixturePlayerStats(fixture.api_football_fixture_id);
      return { fixture, stats, error: null as Error | null };
    } catch (error) {
      console.error(
        "syncLiveStatsFromApi fixture failed",
        fixture.api_football_fixture_id,
        error
      );
      return {
        fixture,
        stats: [] as Awaited<ReturnType<typeof fetchFixturePlayerStats>>,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  });

  const apiPlayerIds: number[] = [];
  for (const block of fetchedBlocks) {
    for (const row of block.stats) {
      const id = row?.player?.id;
      if (id != null) apiPlayerIds.push(id);
    }
  }
  const playerIdByApi = await loadApiFootballIdMap(supabase, apiPlayerIds);

  const upsertRows: Record<string, unknown>[] = [];
  const updatedAt = new Date().toISOString();

  for (const block of fetchedBlocks) {
    if (block.error || block.stats.length === 0) continue;
    const { fixture } = block;
    for (const row of block.stats) {
      const apiPlayerId = row?.player?.id;
      if (apiPlayerId == null) continue;
      const playerId = playerIdByApi.get(apiPlayerId);
      if (!playerId) continue;

      const mapped = mapApiPlayerStatRow(row, {
        homeTeam: fixture.home_team,
        awayTeam: fixture.away_team,
        homeGoals: fixture.home_goals,
        awayGoals: fixture.away_goals,
      });
      if (!mapped) continue;

      upsertRows.push({
        fixture_id: fixture.id,
        player_id: playerId,
        gameweek_id: fixture.gameweek_id,
        ...mapped,
        updated_at: updatedAt,
      });
    }
  }

  let upserted = 0;
  for (let i = 0; i < upsertRows.length; i += STATS_UPSERT_CHUNK) {
    const chunk = upsertRows.slice(i, i + STATS_UPSERT_CHUNK);
    const { error: upsertError } = await supabase
      .from("player_match_stats")
      .upsert(chunk, { onConflict: "fixture_id,player_id" });
    if (upsertError) {
      console.error("player_match_stats batch upsert failed", upsertError);
    } else {
      upserted += chunk.length;
    }
  }

  return {
    mode: "api" as const,
    fetched: toFetch.length,
    skipped,
    upserted,
  };
}

async function hasOpenGameweek(supabase: SupabaseClient): Promise<boolean> {
  const now = Date.now();
  const phase = getActiveTournamentPhase();
  const { data: rows } = await supabase
    .from("gameweeks")
    .select("first_kickoff_at")
    .eq("tournament_phase", phase);
  return (rows ?? []).some(
    (row) => new Date(row.first_kickoff_at).getTime() > now
  );
}

/** Garantiza jornadas futuras. API sync solo si allowApiSync (p. ej. guardar alineación). */
export async function ensureOpenGameweek(
  supabase: SupabaseClient,
  options: { allowApiSync?: boolean } = {}
) {
  if (await hasOpenGameweek(supabase)) return { synced: false as const };

  if (!options.allowApiSync || !isApiFootballConfigured()) {
    return { synced: false as const };
  }

  await syncFixturesFromApi(supabase);
  await tickGameweekStatuses(supabase);
  return { synced: true as const };
}

export async function hasLiveGameweek(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("status", "live")
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** Actualiza estados y bloquea alineaciones al primer pitido (sin sync pesado). */
export async function runGameweekStatusTick(
  supabase: SupabaseClient,
  now = new Date()
) {
  await tickGameweekStatuses(supabase, now);
}

/**
 * Cron HTTP: calendar (throttled) + stats/points for live and finished catch-up.
 */
export async function runGameweekCronPipeline(
  supabase: SupabaseClient,
  options: {
    skipCalendar?: boolean;
    forceCalendar?: boolean;
    gameweekIds?: string[];
  } = {}
) {
  let calendar: Awaited<ReturnType<typeof syncCalendarIfDue>> | null = null;

  if (options.skipCalendar) {
    await runGameweekStatusTick(supabase);
  } else {
    calendar = await syncCalendarIfDue(supabase, {
      force: options.forceCalendar,
    });
  }

  const scoreable = options.gameweekIds?.length
    ? options.gameweekIds.map((id) => ({ id }))
    : await listScoreableGameweeks(supabase);
  if (scoreable.length === 0) {
    return {
      skipped: true as const,
      reason: "no_scoreable_gameweek",
      calendar,
    };
  }

  const ids = scoreable.map((g) => g.id);
  const stats = await syncLiveStatsFromApi(supabase, ids);

  for (const gw of scoreable) {
    await processGameweekPointsAndContracts(supabase, gw.id);
  }

  return {
    skipped: false as const,
    scoreableGameweeks: scoreable.length,
    calendar,
    stats,
  };
}

/**
 * Al abrir la app: solo status + stats/puntos si hay jornada **live**.
 * Calendario completo y catch-up finished → cron (solutions #2–#3).
 */
export async function runPageLoadGameweekTick(supabase: SupabaseClient) {
  await runGameweekStatusTick(supabase);

  const live = await listLiveScoreableGameweeks(supabase);
  if (live.length === 0) {
    return { skipped: true as const, reason: "no_live_gameweek" };
  }

  const ids = live.map((g) => g.id);
  await syncLiveStatsFromApi(supabase, ids);

  for (const gw of live) {
    await processGameweekPointsAndContracts(supabase, gw.id);
  }

  return { skipped: false as const, scoreableGameweeks: live.length };
}

/** @deprecated Usar runGameweekCronPipeline o runPageLoadGameweekTick */
export async function runGameweekPipeline(supabase: SupabaseClient) {
  return runGameweekCronPipeline(supabase, { forceCalendar: true });
}
