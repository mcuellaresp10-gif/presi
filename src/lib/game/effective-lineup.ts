import type { Player } from "./types";
import type { MatchStatLine, PlayerPointsBreakdown, ScoringBreakdownLine } from "./scoring";
import {
  applyCaptainToBreakdown,
  calculatePlayerPointsWithBreakdown,
} from "./scoring";

export interface LineupSelection {
  starterIds: string[];
  benchIds: string[];
  /** Complete 11+5+formation — used for UI CTAs, not for zeroing points. */
  isValid: boolean;
  captainId?: string | null;
}

export interface EffectiveLineupResult {
  scoringPlayers: PlayerPointsBreakdown[];
  contractPlayerIds: string[];
}

const MINUTES_TO_PLAY = 1;

export interface EffectiveLineupOptions {
  benchBoost?: boolean;
  penaltyReduction?: number;
}

function scorePlayer(
  stat: MatchStatLine | undefined,
  options: { penaltyReduction?: number }
): { total: number; lines: ScoringBreakdownLine[] } {
  if (!stat) return { total: 0, lines: [] };
  return calculatePlayerPointsWithBreakdown(stat, options);
}

export function computeEffectiveLineup(
  selection: LineupSelection,
  playersById: Map<string, Player>,
  statsByPlayerId: Map<string, MatchStatLine>,
  options: EffectiveLineupOptions = {}
): EffectiveLineupResult {
  // Incomplete lineups still score: only selected players earn points.
  // Empty slots / missing players simply contribute 0. `isValid` is UI-only
  // (complete 11+5+formation) and no longer zeroes the whole gameweek.

  const scoringOptions = {
    penaltyReduction: options.penaltyReduction,
  };
  const usedBench = new Set<string>();
  const scoringPlayers: PlayerPointsBreakdown[] = [];
  const contractPlayerIds = new Set<string>();

  for (const starterId of selection.starterIds) {
    if (!starterId) continue;
    const starter = playersById.get(starterId);
    if (!starter) continue;

    const starterStats = statsByPlayerId.get(starterId);
    const starterMinutes = starterStats?.minutes ?? 0;

    if (starterMinutes >= MINUTES_TO_PLAY) {
      const isCaptain = selection.captainId === starterId;
      const scored = scorePlayer(starterStats, scoringOptions);
      const withCaptain = applyCaptainToBreakdown(scored, isCaptain);
      scoringPlayers.push({
        playerId: starterId,
        points: withCaptain.total,
        source: "starter",
        minutes: starterMinutes,
        lines: withCaptain.lines,
        isCaptain: isCaptain && withCaptain.total > 0 ? true : undefined,
      });
      contractPlayerIds.add(starterId);
      continue;
    }

    const sub = findBenchSubstitute(
      starter.posicion,
      selection.benchIds,
      usedBench,
      playersById,
      statsByPlayerId,
      scoringOptions,
      selection.captainId
    );

    if (sub) {
      usedBench.add(sub.playerId);
      scoringPlayers.push(sub);
      contractPlayerIds.add(sub.playerId);
    }
  }

  if (options.benchBoost) {
    const scoredIds = new Set(scoringPlayers.map((s) => s.playerId));
    for (const benchId of selection.benchIds) {
      if (scoredIds.has(benchId)) continue;
      const benchPlayer = playersById.get(benchId);
      if (!benchPlayer) continue;
      const stats = statsByPlayerId.get(benchId);
      const minutes = stats?.minutes ?? 0;
      if (minutes < MINUTES_TO_PLAY) continue;
      const isCaptain = selection.captainId === benchId;
      const scored = scorePlayer(stats, scoringOptions);
      const withCaptain = applyCaptainToBreakdown(scored, isCaptain);
      scoringPlayers.push({
        playerId: benchId,
        points: withCaptain.total,
        source: "bench_boost",
        minutes,
        lines: withCaptain.lines,
        isCaptain: isCaptain && withCaptain.total > 0 ? true : undefined,
      });
      contractPlayerIds.add(benchId);
      scoredIds.add(benchId);
    }
  }

  return {
    scoringPlayers,
    contractPlayerIds: Array.from(contractPlayerIds),
  };
}

function findBenchSubstitute(
  position: Player["posicion"],
  benchIds: string[],
  usedBench: Set<string>,
  playersById: Map<string, Player>,
  statsByPlayerId: Map<string, MatchStatLine>,
  scoringOptions: { penaltyReduction?: number },
  captainId: string | null | undefined
): PlayerPointsBreakdown | null {
  for (const benchId of benchIds) {
    if (usedBench.has(benchId)) continue;

    const benchPlayer = playersById.get(benchId);
    if (!benchPlayer || benchPlayer.posicion !== position) continue;

    const stats = statsByPlayerId.get(benchId);
    const minutes = stats?.minutes ?? 0;
    if (minutes < MINUTES_TO_PLAY) continue;

    const isCaptain = captainId === benchId;
    const scored = scorePlayer(stats, scoringOptions);
    const withCaptain = applyCaptainToBreakdown(scored, isCaptain);

    return {
      playerId: benchId,
      points: withCaptain.total,
      source: "bench_sub",
      minutes,
      lines: withCaptain.lines,
      isCaptain: isCaptain && withCaptain.total > 0 ? true : undefined,
    };
  }

  return null;
}

export type PlayerMatchStatRow = {
  player_id: string;
  posicion: Player["posicion"];
  minutes: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  goals_conceded: number;
  started?: boolean;
  team_result?: "win" | "draw" | "loss" | null;
  saves?: number;
  passes_accurate?: number;
  tackles_won?: number;
  dribbles_success?: number;
  key_passes?: number;
  big_chances_created?: number;
  fouls_drawn?: number;
  duels_won?: number;
  duels_lost?: number;
  fouls_committed?: number;
  clean_sheet?: boolean;
};

export function matchStatLineFromRow(row: PlayerMatchStatRow): MatchStatLine {
  return {
    playerId: row.player_id,
    posicion: row.posicion,
    minutes: row.minutes,
    goals: row.goals,
    assists: row.assists,
    yellowCards: row.yellow_cards,
    redCards: row.red_cards,
    goalsConceded: row.goals_conceded,
    started: row.started ?? false,
    teamResult: row.team_result ?? null,
    saves: row.saves ?? 0,
    passesAccurate: row.passes_accurate ?? 0,
    tacklesWon: row.tackles_won ?? 0,
    dribblesSuccess: row.dribbles_success ?? 0,
    keyPasses: row.key_passes ?? 0,
    bigChancesCreated: row.big_chances_created ?? 0,
    foulsDrawn: row.fouls_drawn ?? 0,
    duelsWon: row.duels_won ?? 0,
    duelsLost: row.duels_lost ?? 0,
    foulsCommitted: row.fouls_committed ?? 0,
  };
}

export function buildStatsMapFromRows(
  rows: PlayerMatchStatRow[]
): Map<string, MatchStatLine> {
  const map = new Map<string, MatchStatLine>();
  for (const row of rows) {
    map.set(row.player_id, matchStatLineFromRow(row));
  }
  return map;
}
