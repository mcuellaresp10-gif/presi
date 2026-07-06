"use server";

import { cache } from "react";
import { DEFAULT_LEAGUE_NAME, DEFAULT_SEASON } from "@/lib/api-football/client";
import { deriveGameweekStatus, gameweekPhaseLabel } from "@/lib/gameweek/status";
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
  firstKickoffAt: string;
  lastKickoffAt: string | null;
  status: ReturnType<typeof deriveGameweekStatus>;
  statusLabel: string;
  fixtures: CalendarFixture[];
};

export const getLeagueCalendar = cache(async function getLeagueCalendar(): Promise<{
  leagueName: string;
  season: number;
  gameweeks: CalendarGameweek[];
}> {
  const supabase = await createClient();
  const now = new Date();
  const season = DEFAULT_SEASON;

  const { data: gameweekRows } = await supabase
    .from("gameweeks")
    .select("id, season, round, first_kickoff_at, last_kickoff_at")
    .eq("season", season)
    .order("round", { ascending: true });

  if (!gameweekRows?.length) {
    return { leagueName: DEFAULT_LEAGUE_NAME, season, gameweeks: [] };
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

  const gameweeks: CalendarGameweek[] = gameweekRows.map((row) => {
    const status = deriveGameweekStatus(
      row.first_kickoff_at,
      row.last_kickoff_at,
      now
    );
    return {
      id: row.id,
      round: row.round,
      season: row.season,
      firstKickoffAt: row.first_kickoff_at,
      lastKickoffAt: row.last_kickoff_at,
      status,
      statusLabel: gameweekPhaseLabel(status),
      fixtures: fixturesByGameweek.get(row.id) ?? [],
    };
  });

  return { leagueName: DEFAULT_LEAGUE_NAME, season, gameweeks };
});
