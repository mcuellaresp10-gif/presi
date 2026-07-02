import {
  DEFAULT_LEAGUE_ID,
  DEFAULT_SEASON,
  fetchFixturePlayerStats,
  fetchLeagueFixtures,
  fetchLeaguePlayers,
  isApiFootballConfigured,
  mapApiPosition,
  parseRoundNumber,
} from "@/lib/api-football/client";
import { mapApiPlayerStatRow } from "@/lib/api-football/map-stats";
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

  let page = 1;
  let synced = 0;

  while (page <= 5) {
    const batch = await fetchLeaguePlayers(leagueId, season, page);
    if (!batch.length) break;

    for (const row of batch) {
      const apiId = row.player.id;
      const posicion = mapApiPosition(row.statistics[0]?.games?.position ?? null);
      const equipo = row.statistics[0]?.team?.name ?? "Liga BetPlay";

      const { data: existing } = await supabase
        .from("players_master")
        .select("id")
        .eq("api_football_id", apiId)
        .maybeSingle();

      const rareza = "bronce";
      const costo_base = 3_000_000;

      if (existing) {
        await supabase
          .from("players_master")
          .update({
            nombre: row.player.name,
            equipo_real: equipo,
            posicion,
            photo_url: row.player.photo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("players_master").insert({
          api_football_id: apiId,
          nombre: row.player.name,
          equipo_real: equipo,
          posicion,
          rareza,
          costo_base,
          photo_url: row.player.photo,
        });
      }
      synced += 1;
    }

    page += 1;
  }

  return { synced, mode: "api" as const };
}

export async function syncFixturesFromApi(
  supabase: SupabaseClient,
  leagueId = DEFAULT_LEAGUE_ID,
  season = DEFAULT_SEASON
) {
  if (!isApiFootballConfigured()) {
    await ensureDevGameweek(supabase);
    return { mode: "dev" as const };
  }

  const fixtures = await fetchLeagueFixtures(leagueId, season);
  const byRound = new Map<number, typeof fixtures>();

  for (const f of fixtures) {
    const round = parseRoundNumber(f.league.round);
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(f);
  }

  for (const [round, roundFixtures] of Array.from(byRound.entries())) {
    const kickoffs = roundFixtures.map((f) => new Date(f.fixture.date).getTime());
    const firstKickoff = new Date(Math.min(...kickoffs));
    const lastKickoff = new Date(Math.max(...kickoffs));

    const { data: gw } = await supabase
      .from("gameweeks")
      .upsert(
        {
          season,
          round,
          first_kickoff_at: firstKickoff.toISOString(),
          last_kickoff_at: lastKickoff.toISOString(),
          status: "upcoming",
        },
        { onConflict: "season,round" }
      )
      .select()
      .single();

    if (!gw) continue;

    for (const f of roundFixtures) {
      await supabase.from("fixtures").upsert(
        {
          gameweek_id: gw.id,
          api_football_fixture_id: f.fixture.id,
          kickoff_at: f.fixture.date,
          home_team: f.teams.home.name,
          away_team: f.teams.away.name,
          home_goals: f.goals.home,
          away_goals: f.goals.away,
          status: f.fixture.status.short,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "api_football_fixture_id" }
      );
    }
  }

  return { mode: "api" as const, rounds: byRound.size };
}

export async function syncLiveStatsFromApi(supabase: SupabaseClient) {
  if (!isApiFootballConfigured()) {
    await syncDevMockStats(supabase);
    return { mode: "dev" as const };
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
        const apiPlayerId = row.player.id;
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
  const { data: rows } = await supabase.from("gameweeks").select("first_kickoff_at");
  return (rows ?? []).some(
    (row) => new Date(row.first_kickoff_at).getTime() > now
  );
}

/** Garantiza al menos una jornada con primer partido en el futuro. */
async function ensureOpenGameweek(supabase: SupabaseClient) {
  if (await hasOpenGameweek(supabase)) return;

  if (isApiFootballConfigured()) {
    await syncFixturesFromApi(supabase);
    await tickGameweekStatuses(supabase);
    if (await hasOpenGameweek(supabase)) return;
  }

  const { data: latest } = await supabase
    .from("gameweeks")
    .select("*")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) {
    await ensureDevGameweek(supabase);
    return;
  }

  const firstKickoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const lastKickoff = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await supabase
    .from("gameweeks")
    .update({
      first_kickoff_at: firstKickoff.toISOString(),
      last_kickoff_at: lastKickoff.toISOString(),
      status: "upcoming",
    })
    .eq("id", latest.id);
}

async function ensureDevGameweek(supabase: SupabaseClient) {
  const season = DEFAULT_SEASON;
  const firstKickoff = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const lastKickoff = new Date(Date.now() + 6 * 60 * 60 * 1000);

  const { data: gw } = await supabase
    .from("gameweeks")
    .upsert(
      {
        season,
        round: 1,
        first_kickoff_at: firstKickoff.toISOString(),
        last_kickoff_at: lastKickoff.toISOString(),
        status: "upcoming",
      },
      { onConflict: "season,round" }
    )
    .select()
    .single();

  if (!gw) return;

  const { data: players } = await supabase
    .from("players_master")
    .select("id")
    .limit(20);

  if (!players?.length) return;

  const { data: existingFixture } = await supabase
    .from("fixtures")
    .select("id")
    .eq("gameweek_id", gw.id)
    .limit(1)
    .maybeSingle();

  if (existingFixture) return;

  const { data: fixture } = await supabase
    .from("fixtures")
    .insert({
      gameweek_id: gw.id,
      api_football_fixture_id: 900000 + season,
      kickoff_at: firstKickoff.toISOString(),
      home_team: "Mock FC",
      away_team: "Dev United",
      home_goals: 2,
      away_goals: 1,
      status: "NS",
    })
    .select()
    .single();

  if (!fixture) return;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    await supabase.from("player_match_stats").upsert(
      {
        fixture_id: fixture.id,
        player_id: p.id,
        gameweek_id: gw.id,
        minutes: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        clean_sheet: false,
        goals_conceded: 0,
        started: i < 11,
        team_side: i % 2 === 0 ? "home" : "home",
        team_result: "win",
        saves: i === 0 ? 0 : 0,
        passes_accurate: 0,
        tackles_won: 0,
        dribbles_success: 0,
        key_passes: 0,
        big_chances_created: 0,
        fouls_drawn: 0,
        duels_won: 0,
        duels_lost: 0,
        fouls_committed: 0,
      },
      { onConflict: "fixture_id,player_id" }
    );
  }
}

async function syncDevMockStats(supabase: SupabaseClient) {
  const { data: liveGw } = await supabase
    .from("gameweeks")
    .select("id, status, first_kickoff_at")
    .order("round", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!liveGw) {
    await ensureDevGameweek(supabase);
    return;
  }

  const now = Date.now();
  const started = now >= new Date(liveGw.first_kickoff_at).getTime();

  if (started && liveGw.status === "upcoming") {
    await supabase
      .from("gameweeks")
      .update({ status: "live" })
      .eq("id", liveGw.id);
  }

  if (!started) return;

  const { data: stats } = await supabase
    .from("player_match_stats")
    .select("id, minutes, goals, player_id, started, passes_accurate, tackles_won, key_passes")
    .eq("gameweek_id", liveGw.id);

  const statRows = stats ?? [];
  for (let idx = 0; idx < statRows.length; idx++) {
    const row = statRows[idx];
    const minutes = Math.min(90, (row.minutes ?? 0) + 15);
    const updates: Record<string, unknown> = {
      minutes,
      updated_at: new Date().toISOString(),
      team_result: "win",
      started: row.started ?? idx < 11,
    };
    if (minutes >= 60 && row.goals === 0 && idx % 5 === 0) {
      updates.goals = 1;
    }
    if (idx === 0) {
      updates.saves = 4;
    }
    if (idx === 3) {
      updates.passes_accurate = 72;
      updates.tackles_won = 2;
    }
    if (idx === 7) {
      updates.assists = 1;
      updates.key_passes = 2;
      updates.dribbles_success = 1;
    }
    await supabase.from("player_match_stats").update(updates).eq("id", row.id);
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
  await runGameweekStatusTick(supabase);

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

  return { skipped: false as const, liveGameweeks: liveRows?.length ?? 0 };
}

/** Al abrir la app: tick de estado + sync en vivo solo si corresponde. */
export async function runPageLoadGameweekTick(supabase: SupabaseClient) {
  if (!isApiFootballConfigured()) {
    await ensureDevGameweek(supabase);
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

  return { skipped: false as const };
}

/** @deprecated Usar runGameweekCronPipeline o runPageLoadGameweekTick */
export async function runGameweekPipeline(supabase: SupabaseClient) {
  if (!isApiFootballConfigured()) {
    await ensureDevGameweek(supabase);
  }
  await syncFixturesFromApi(supabase);
  return runGameweekCronPipeline(supabase);
}
