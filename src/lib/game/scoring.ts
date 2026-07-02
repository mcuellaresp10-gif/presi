import type { Position } from "./types";
import {
  applyCaptainToBreakdown,
  calculatePlayerPointsWithBreakdown as scoreStatLine,
  mergeBreakdownLines,
  scoreGameweekStatLines,
  type ScoringBreakdownLine,
  type ScoringStatInput,
  type TeamResult,
} from "./scoring-rules";

export type { ScoringBreakdownLine, TeamResult };

export interface MatchStatLine {
  playerId: string;
  posicion: Position;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  goalsConceded: number;
  started: boolean;
  teamResult: TeamResult;
  saves: number;
  passesAccurate: number;
  tacklesWon: number;
  dribblesSuccess: number;
  keyPasses: number;
  bigChancesCreated: number;
  foulsDrawn: number;
  duelsWon: number;
  duelsLost: number;
  foulsCommitted: number;
  teamWinCount?: number;
  teamDrawCount?: number;
  startedMatchCount?: number;
  /** @deprecated legacy field; not used in new scoring */
  cleanSheet?: boolean;
}

export interface ScoringOptions {
  penaltyReduction?: number;
}

export function emptyMatchStatLine(
  playerId: string,
  posicion: Position
): MatchStatLine {
  return {
    playerId,
    posicion,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    goalsConceded: 0,
    started: false,
    teamResult: null,
    saves: 0,
    passesAccurate: 0,
    tacklesWon: 0,
    dribblesSuccess: 0,
    keyPasses: 0,
    bigChancesCreated: 0,
    foulsDrawn: 0,
    duelsWon: 0,
    duelsLost: 0,
    foulsCommitted: 0,
  };
}

export function toScoringInput(stat: MatchStatLine): ScoringStatInput {
  return {
    posicion: stat.posicion,
    minutes: stat.minutes,
    goals: stat.goals,
    assists: stat.assists,
    yellowCards: stat.yellowCards,
    redCards: stat.redCards,
    goalsConceded: stat.goalsConceded,
    started: stat.started,
    teamResult: stat.teamResult,
    saves: stat.saves,
    passesAccurate: stat.passesAccurate,
    tacklesWon: stat.tacklesWon,
    dribblesSuccess: stat.dribblesSuccess,
    keyPasses: stat.keyPasses,
    bigChancesCreated: stat.bigChancesCreated,
    foulsDrawn: stat.foulsDrawn,
    duelsWon: stat.duelsWon,
    duelsLost: stat.duelsLost,
    foulsCommitted: stat.foulsCommitted,
    teamWinCount: stat.teamWinCount,
    teamDrawCount: stat.teamDrawCount,
    startedMatchCount: stat.startedMatchCount,
  };
}

export function calculatePlayerPointsWithBreakdown(
  stat: MatchStatLine,
  options: ScoringOptions = {}
) {
  return scoreStatLine(toScoringInput(stat), options);
}

export function calculatePlayerPoints(
  stat: MatchStatLine,
  options: ScoringOptions = {}
): number {
  return calculatePlayerPointsWithBreakdown(stat, options).total;
}

export function aggregateGameweekStats(
  lines: MatchStatLine[]
): Map<string, MatchStatLine> {
  const byPlayer = new Map<string, MatchStatLine>();

  for (const line of lines) {
    const existing = byPlayer.get(line.playerId);
    if (!existing) {
      byPlayer.set(line.playerId, {
        ...line,
        startedMatchCount: line.started && line.minutes >= 1 ? 1 : 0,
        teamWinCount:
          line.teamResult === "win" && line.minutes >= 55 ? 1 : 0,
        teamDrawCount:
          line.teamResult === "draw" && line.minutes >= 55 ? 1 : 0,
      });
      continue;
    }

    byPlayer.set(line.playerId, {
      ...existing,
      minutes: existing.minutes + line.minutes,
      goals: existing.goals + line.goals,
      assists: existing.assists + line.assists,
      yellowCards: existing.yellowCards + line.yellowCards,
      redCards: existing.redCards + line.redCards,
      goalsConceded: existing.goalsConceded + line.goalsConceded,
      saves: existing.saves + line.saves,
      passesAccurate: existing.passesAccurate + line.passesAccurate,
      tacklesWon: existing.tacklesWon + line.tacklesWon,
      dribblesSuccess: existing.dribblesSuccess + line.dribblesSuccess,
      keyPasses: existing.keyPasses + line.keyPasses,
      bigChancesCreated:
        existing.bigChancesCreated + line.bigChancesCreated,
      foulsDrawn: existing.foulsDrawn + line.foulsDrawn,
      duelsWon: existing.duelsWon + line.duelsWon,
      duelsLost: existing.duelsLost + line.duelsLost,
      foulsCommitted: existing.foulsCommitted + line.foulsCommitted,
      started: existing.started || line.started,
      teamResult: pickLatestTeamResult(existing.teamResult, line.teamResult),
      startedMatchCount:
        (existing.startedMatchCount ?? 0) +
        (line.started && line.minutes >= 1 ? 1 : 0),
      teamWinCount:
        (existing.teamWinCount ?? 0) +
        (line.teamResult === "win" && line.minutes >= 55 ? 1 : 0),
      teamDrawCount:
        (existing.teamDrawCount ?? 0) +
        (line.teamResult === "draw" && line.minutes >= 55 ? 1 : 0),
    });
  }

  return byPlayer;
}

function pickLatestTeamResult(
  a: TeamResult,
  b: TeamResult
): TeamResult {
  return b ?? a;
}

/** Score all fixture lines for one player in a gameweek (handles multi-match). */
export function calculatePlayerGameweekScore(
  fixtureLines: MatchStatLine[],
  options: ScoringOptions = {}
): { total: number; lines: ScoringBreakdownLine[] } {
  if (fixtureLines.length === 0) {
    return { total: 0, lines: [] };
  }
  if (fixtureLines.length === 1) {
    return calculatePlayerPointsWithBreakdown(fixtureLines[0], options);
  }
  return scoreGameweekStatLines(
    fixtureLines.map(toScoringInput),
    options
  );
}

export interface PlayerPointsBreakdown {
  playerId: string;
  points: number;
  source: "starter" | "bench_sub" | "bench_boost";
  minutes: number;
  isCaptain?: boolean;
  lines?: ScoringBreakdownLine[];
}

export function calculateClubGameweekPoints(
  breakdown: PlayerPointsBreakdown[]
): number {
  return breakdown.reduce((sum, row) => sum + row.points, 0);
}

export { applyCaptainToBreakdown, mergeBreakdownLines };
