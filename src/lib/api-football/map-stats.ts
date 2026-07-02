import type { TeamResult } from "@/lib/game/scoring-rules";
import type { ApiPlayerStats } from "./client";

export type TeamSide = "home" | "away";

export function computeTeamResult(
  teamSide: TeamSide | null,
  homeGoals: number | null,
  awayGoals: number | null
): TeamResult {
  if (
    teamSide == null ||
    homeGoals == null ||
    awayGoals == null
  ) {
    return null;
  }
  const scored = teamSide === "home" ? homeGoals : awayGoals;
  const conceded = teamSide === "home" ? awayGoals : homeGoals;
  if (scored > conceded) return "win";
  if (scored < conceded) return "loss";
  return "draw";
}

export function resolveTeamSide(
  teamName: string | undefined,
  homeTeam: string,
  awayTeam: string
): TeamSide | null {
  if (!teamName) return null;
  const norm = teamName.trim().toLowerCase();
  if (homeTeam.trim().toLowerCase() === norm) return "home";
  if (awayTeam.trim().toLowerCase() === norm) return "away";
  return null;
}

function parseAccuracyPercent(accuracy: string | number | null | undefined): number {
  if (accuracy == null) return 0;
  if (typeof accuracy === "number") return accuracy;
  const n = parseInt(String(accuracy).replace("%", ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function mapApiPlayerStatRow(
  row: ApiPlayerStats,
  context: {
    homeTeam: string;
    awayTeam: string;
    homeGoals: number | null;
    awayGoals: number | null;
  }
) {
  const stat = row.statistics[0];
  if (!stat) return null;

  const teamSide = resolveTeamSide(
    stat.team?.name,
    context.homeTeam,
    context.awayTeam
  );
  const passesTotal = stat.passes?.total ?? 0;
  const accuracy = parseAccuracyPercent(stat.passes?.accuracy ?? null);
  const passesAccurate = Math.round(passesTotal * (accuracy / 100));
  const duelsTotal = stat.duels?.total ?? 0;
  const duelsWon = stat.duels?.won ?? 0;

  return {
    minutes: stat.games.minutes ?? 0,
    goals: stat.goals.total ?? 0,
    assists: stat.goals.assists ?? 0,
    yellow_cards: stat.cards.yellow ?? 0,
    red_cards: stat.cards.red ?? 0,
    goals_conceded: stat.goals.conceded ?? 0,
    started: stat.games.substitute === false,
    team_side: teamSide,
    team_result: computeTeamResult(teamSide, context.homeGoals, context.awayGoals),
    saves: stat.goals.saves ?? 0,
    passes_accurate: passesAccurate,
    tackles_won: stat.tackles?.total ?? 0,
    dribbles_success: stat.dribbles?.success ?? 0,
    key_passes: stat.passes?.key ?? 0,
    big_chances_created: 0,
    fouls_drawn: stat.fouls?.drawn ?? 0,
    duels_won: duelsWon,
    duels_lost: Math.max(0, duelsTotal - duelsWon),
    fouls_committed: stat.fouls?.committed ?? 0,
    clean_sheet: false,
  };
}
