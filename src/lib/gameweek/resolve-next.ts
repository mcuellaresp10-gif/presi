import { DEFAULT_SEASON } from "@/lib/api-football/client";
import { deriveGameweekStatus } from "@/lib/gameweek/status";
import {
  getActiveTournamentPhase,
  inferTournamentPhaseFromDate,
} from "@/lib/gameweek/tournament";
import { isFixtureFinished } from "@/lib/gameweek/format";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GameweekRow = {
  id: string;
  season: number;
  round: number;
  tournament_phase?: string;
  first_kickoff_at: string;
  last_kickoff_at: string | null;
  status: string;
};

type FixtureWithGameweek = {
  kickoff_at: string;
  status: string;
  gameweeks: GameweekRow | GameweekRow[];
};

/** Próxima jornada según partidos reales (no la columna first_kickoff_at, que puede estar corrupta). */
export async function resolveNextGameweekRow(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<GameweekRow | null> {
  const tournamentPhase = getActiveTournamentPhase(now);
  const season = DEFAULT_SEASON;

  const { data: fixtureRows } = await supabase
    .from("fixtures")
    .select(
      "kickoff_at, status, gameweeks!inner(id, season, round, tournament_phase, first_kickoff_at, last_kickoff_at, status)"
    )
    .eq("gameweeks.season", season)
    .eq("gameweeks.tournament_phase", tournamentPhase)
    .gt("kickoff_at", now.toISOString())
    .order("kickoff_at", { ascending: true });

  for (const row of fixtureRows ?? []) {
    const fixture = row as FixtureWithGameweek;
    if (inferTournamentPhaseFromDate(fixture.kickoff_at) !== tournamentPhase) {
      continue;
    }
    if (isFixtureFinished(fixture.status)) continue;

    const gw = Array.isArray(fixture.gameweeks)
      ? fixture.gameweeks[0]
      : fixture.gameweeks;
    if (!gw) continue;

    const kickoffs = (fixtureRows ?? [])
      .filter((f) => {
        const item = f as FixtureWithGameweek;
        const itemGw = Array.isArray(item.gameweeks)
          ? item.gameweeks[0]
          : item.gameweeks;
        return itemGw?.id === gw.id;
      })
      .map((f) => new Date((f as FixtureWithGameweek).kickoff_at).getTime());

    return {
      ...gw,
      first_kickoff_at: new Date(Math.min(...kickoffs)).toISOString(),
      last_kickoff_at: new Date(Math.max(...kickoffs)).toISOString(),
      status: deriveGameweekStatus(
        new Date(Math.min(...kickoffs)).toISOString(),
        new Date(Math.max(...kickoffs)).toISOString(),
        now
      ),
    };
  }

  return null;
}

/** Detecta jornadas fantasma (p. ej. J20 con pitido en horas vs J1 en semanas). */
export async function isCalendarStale(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<boolean> {
  const tournamentPhase = getActiveTournamentPhase(now);
  const season = DEFAULT_SEASON;
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const maxPlausibleRound =
    tournamentPhase === "clausura" && month === 7 && day < 24
      ? 2
      : tournamentPhase === "apertura" && month <= 2
        ? 2
        : 99;

  const [fromFixtures, fromTable] = await Promise.all([
    resolveNextGameweekRow(supabase, now),
    supabase
      .from("gameweeks")
      .select("id, round, first_kickoff_at")
      .eq("season", season)
      .eq("tournament_phase", tournamentPhase)
      .gt("first_kickoff_at", now.toISOString())
      .order("first_kickoff_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!fromFixtures) return true;

  if (fromFixtures.round > maxPlausibleRound) return true;
  if (fromTable.data && fromTable.data.round > maxPlausibleRound) return true;

  if (!fromTable.data) return false;

  if (fromTable.data.id !== fromFixtures.id) return true;
  if (fromTable.data.round !== fromFixtures.round) return true;

  const tableMs = new Date(fromTable.data.first_kickoff_at).getTime();
  const fixtureMs = new Date(fromFixtures.first_kickoff_at).getTime();
  return Math.abs(tableMs - fixtureMs) > 6 * 60 * 60 * 1000;
}
