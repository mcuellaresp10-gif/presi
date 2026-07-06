"use server";

import { cache } from "react";
import {
  DEFAULT_LEAGUE_NAME,
  DEFAULT_SEASON,
} from "@/lib/api-football/client";
import {
  deriveGameweekStatusFromFixtures,
  gameweekPhaseLabel,
} from "@/lib/gameweek/status";
import {
  getActiveTournamentPhase,
  inferTournamentPhaseFromDate,
  tournamentPhaseLabel,
} from "@/lib/gameweek/tournament";
import { createClient } from "@/lib/supabase/server";

export type CalendarFixture = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

export type CalendarGameweek = {
  id: string;
  round: number;
  season: number;
  tournamentPhase: string;
  firstKickoffAt: string;
  lastKickoffAt: string | null;
  status: ReturnType<typeof deriveGameweekStatusFromFixtures>;
  statusLabel: string;
  fixtures: CalendarFixture[];
};

export const getLeagueCalendar = cache(async function getLeagueCalendar(): Promise<{
  leagueName: string;
  season: number;
  tournamentPhase: string;
  tournamentLabel: string;
  gameweeks: CalendarGameweek[];
}> {
  const supabase = await createClient();
  const now = new Date();
  const season = DEFAULT_SEASON;
  const tournamentPhase = getActiveTournamentPhase(now);
  const tournamentLabel = tournamentPhaseLabel(
    tournamentPhase as "apertura" | "clausura"
  );

  const { data: gameweekRows } = await supabase
    .from("gameweeks")
    .select("id, season, round, tournament_phase, first_kickoff_at, last_kickoff_at")
    .eq("season", season)
    .eq("tournament_phase", tournamentPhase)
    .order("round", { ascending: true });

  if (!gameweekRows?.length) {
    return {
      leagueName: DEFAULT_LEAGUE_NAME,
      season,
      tournamentPhase,
      tournamentLabel,
      gameweeks: [],
    };
  }

  const gameweekIds = gameweekRows.map((row) => row.id);
  const { data: fixtureRows } = await supabase
    .from("fixtures")
    .select(
      "id, gameweek_id, kickoff_at, home_team, away_team, status, home_goals, away_goals"
    )
    .in("gameweek_id", gameweekIds)
    .order("kickoff_at", { ascending: true });

  const fixturesByGameweek = new Map<string, CalendarFixture[]>();
  for (const row of fixtureRows ?? []) {
    if (
      inferTournamentPhaseFromDate(row.kickoff_at) !== tournamentPhase
    ) {
      continue;
    }

    const list = fixturesByGameweek.get(row.gameweek_id) ?? [];
    list.push({
      id: row.id,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      kickoffAt: row.kickoff_at,
      status: row.status,
      homeGoals: row.home_goals ?? null,
      awayGoals: row.away_goals ?? null,
    });
    fixturesByGameweek.set(row.gameweek_id, list);
  }

  const gameweeks: CalendarGameweek[] = gameweekRows
    .map((row) => {
      const fixtures = fixturesByGameweek.get(row.id) ?? [];
      const kickoffs = fixtures.map((fixture) =>
        new Date(fixture.kickoffAt).getTime()
      );
      const firstKickoffAt =
        kickoffs.length > 0
          ? new Date(Math.min(...kickoffs)).toISOString()
          : row.first_kickoff_at;
      const lastKickoffAt =
        kickoffs.length > 0
          ? new Date(Math.max(...kickoffs)).toISOString()
          : row.last_kickoff_at;

      const status = deriveGameweekStatusFromFixtures(fixtures, now);

      return {
        id: row.id,
        round: row.round,
        season: row.season,
        tournamentPhase: row.tournament_phase ?? tournamentPhase,
        firstKickoffAt,
        lastKickoffAt,
        status,
        statusLabel: gameweekPhaseLabel(status),
        fixtures,
      };
    })
    .filter((gameweek) => gameweek.fixtures.length > 0);

  return {
    leagueName: DEFAULT_LEAGUE_NAME,
    season,
    tournamentPhase,
    tournamentLabel,
    gameweeks,
  };
});
