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
import type { SupabaseClient } from "@supabase/supabase-js";

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
      photo_url: player.photo,
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

    const { data: gw } = await supabase
      .from("gameweeks")
      .upsert(
        {
          season,
          tournament_phase: phase,
          round,
          first_kickoff_at: firstKickoff.toISOString(),
          last_kickoff_at: lastKickoff.toISOString(),
          status: "upcoming",
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

export async function syncLiveStatsFromApi(supabase: SupabaseClient) {
  if (!isApiFootballConfigured()) {
    return { mode: "skip" as const };
  }

  const { data: liveGameweeks } = await supabase
    .from("gameweeks")
    .select("id")
    .in("status", ["live", "finished"]);

  for (const gw of liveGameweeks ?? []) {
    const { data: fixtures } = await supabase
      .from("fixtures")
      .select(
        "id, api_football_fixture_id, gameweek_id, home_team, away_team, home_goals, away_goals"
      )
      .eq("gameweek_id", gw.id);

    for (const fixture of fixtures ?? []) {
      const stats = await fetchFixturePlayerStats(fixture.api_football_fixture_id);

      for (const row of stats) {
        const apiPlayerId = row?.player?.id;
        if (apiPlayerId == null) continue;

        const { data: player } = await supabase
          .from("players_master")
          .select("id")
          .eq("api_football_id", apiPlayerId)
          .maybeSingle();

        if (!player) continue;

        const mapped = mapApiPlayerStatRow(row, {
          homeTeam: fixture.home_team,
          awayTeam: fixture.away_team,
          homeGoals: fixture.home_goals,
          awayGoals: fixture.away_goals,
        });
        if (!mapped) continue;

        await supabase.from("player_match_stats").upsert(
          {
            fixture_id: fixture.id,
            player_id: player.id,
            gameweek_id: fixture.gameweek_id,
            ...mapped,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "fixture_id,player_id" }
        );
      }
    }
  }

  return { mode: "api" as const };
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

/** Garantiza jornadas futuras sincronizadas desde la API (sin fechas inventadas). */
export async function ensureOpenGameweek(supabase: SupabaseClient) {
  if (await hasOpenGameweek(supabase)) return;

  if (isApiFootballConfigured()) {
    await syncFixturesFromApi(supabase);
    await tickGameweekStatuses(supabase);
  }
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
 * Cron HTTP: solo sync de stats + puntos si hay jornada `live`.
 * Si no hay partidos en vivo, responde al instante sin llamar API-Football.
 */
export async function runGameweekCronPipeline(supabase: SupabaseClient) {
  if (isApiFootballConfigured()) {
    await syncCalendarFromApi(supabase);
  } else {
    await runGameweekStatusTick(supabase);
  }

  const live = await hasLiveGameweek(supabase);
  if (!live) {
    return { skipped: true as const, reason: "no_live_gameweek" };
  }

  await syncLiveStatsFromApi(supabase);

  const { data: liveRows } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("status", "live");

  for (const gw of liveRows ?? []) {
    await processGameweekPointsAndContracts(supabase, gw.id);
  }

  await reTierPlayersFromApi(supabase);

  return { skipped: false as const, liveGameweeks: liveRows?.length ?? 0 };
}

/** Al abrir la app: sync jugadores + tick de estado + stats en vivo si corresponde. */
export async function runPageLoadGameweekTick(supabase: SupabaseClient) {
  if (isApiFootballConfigured()) {
    await syncPlayersFromApi(supabase);
  }

  await ensureOpenGameweek(supabase);
  await runGameweekStatusTick(supabase);

  if (!(await hasLiveGameweek(supabase))) {
    return { skipped: true as const, reason: "no_live_gameweek" };
  }

  await syncLiveStatsFromApi(supabase);

  const { data: liveRows } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("status", "live");

  for (const gw of liveRows ?? []) {
    await processGameweekPointsAndContracts(supabase, gw.id);
  }

  await reTierPlayersFromApi(supabase);

  return { skipped: false as const };
}

/** @deprecated Usar runGameweekCronPipeline o runPageLoadGameweekTick */
export async function runGameweekPipeline(supabase: SupabaseClient) {
  if (isApiFootballConfigured()) {
    await syncPlayersFromApi(supabase);
  }
  await syncFixturesFromApi(supabase);
  return runGameweekCronPipeline(supabase);
}
