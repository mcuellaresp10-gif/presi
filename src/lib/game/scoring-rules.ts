import type { Position } from "./types";

export type TeamResult = "win" | "draw" | "loss" | null;

export interface ScoringBreakdownLine {
  id: string;
  label: string;
  count: number;
  points: number;
}

export interface ScoringOptions {
  /** 0–1, from cuerpo médico: reduces negative lines only. */
  penaltyReduction?: number;
}

const GOAL_POINTS: Record<Position, number> = {
  GK: 10,
  DEF: 12,
  MED: 10,
  DEL: 8,
};

const TACKLE_POINTS: Record<Position, number> = {
  GK: 1,
  DEF: 1,
  MED: 1,
  DEL: 2,
};

/** Points per N aerial duels won (floor division). */
const AERIAL_WON_DIVISOR: Partial<Record<Position, number>> = {
  DEF: 4,
  MED: 4,
  DEL: 2,
};

function penaltyScale(reduction: number | undefined): number {
  return 1 - Math.min(Math.max(reduction ?? 0, 0), 0.75);
}

function applyNegative(points: number, scale: number): number {
  if (points >= 0) return points;
  return Math.round(points * scale);
}

function addLine(
  lines: ScoringBreakdownLine[],
  id: string,
  label: string,
  count: number,
  points: number,
  negativeScale = 1
) {
  if (count <= 0 || points === 0) return;
  const scaled =
    points < 0 ? applyNegative(points, negativeScale) : points;
  lines.push({ id, label, count, points: scaled });
}

export interface ScoringStatInput {
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
  /** Pre-aggregated: number of fixtures with win + 55+ min */
  teamWinCount?: number;
  /** Pre-aggregated: number of fixtures with draw + 55+ min */
  teamDrawCount?: number;
  /** Pre-aggregated: number of fixtures started with minutes */
  startedMatchCount?: number;
}

export function calculatePlayerPointsWithBreakdown(
  stat: ScoringStatInput,
  options: ScoringOptions = {}
): { total: number; lines: ScoringBreakdownLine[] } {
  if (stat.minutes < 1) {
    return { total: 0, lines: [] };
  }

  const lines: ScoringBreakdownLine[] = [];
  const negScale = penaltyScale(options.penaltyReduction);
  const pos = stat.posicion;

  const startedCount =
    stat.startedMatchCount ?? (stat.started ? 1 : 0);
  addLine(lines, "started", "Started Game", startedCount, startedCount * 3);

  const winCount =
    stat.teamWinCount ??
    (stat.teamResult === "win" && stat.minutes >= 55 ? 1 : 0);
  addLine(
    lines,
    "team_win",
    "Team win (55+ mins played)",
    winCount,
    winCount * 5
  );

  const drawCount =
    stat.teamDrawCount ??
    (stat.teamResult === "draw" && stat.minutes >= 55 ? 1 : 0);
  addLine(
    lines,
    "team_draw",
    "Team draw (55+ mins played)",
    drawCount,
    drawCount * 1
  );

  if (stat.goals > 0) {
    addLine(
      lines,
      "goals",
      "Goals Scored",
      stat.goals,
      stat.goals * GOAL_POINTS[pos]
    );
  }

  if (stat.assists > 0) {
    addLine(lines, "assists", "Assists", stat.assists, stat.assists * 8);
  }

  if (pos === "GK" && stat.saves > 0) {
    addLine(lines, "saves", "GK saves", stat.saves, stat.saves * 1);
  }

  if (pos !== "GK") {
    if (stat.passesAccurate >= 90) {
      addLine(
        lines,
        "passes_90",
        "90+ Accurate Passes",
        1,
        6
      );
    } else if (stat.passesAccurate >= 60) {
      addLine(
        lines,
        "passes_60",
        "60+ Accurate Passes",
        1,
        3
      );
    }
  }

  if (stat.tacklesWon > 0) {
    addLine(
      lines,
      "tackles",
      "Won tackles",
      stat.tacklesWon,
      stat.tacklesWon * TACKLE_POINTS[pos]
    );
  }

  if (stat.keyPasses > 0) {
    addLine(
      lines,
      "key_passes",
      "Attempts assisted",
      stat.keyPasses,
      stat.keyPasses * 1
    );
  }

  if (stat.dribblesSuccess > 0) {
    addLine(
      lines,
      "dribbles",
      "Successful Dribbles",
      stat.dribblesSuccess,
      stat.dribblesSuccess * 1
    );
  }

  if ((pos === "MED" || pos === "DEL") && stat.bigChancesCreated > 0) {
    addLine(
      lines,
      "big_chances",
      "Big Chances Created",
      stat.bigChancesCreated,
      stat.bigChancesCreated * 2
    );
  }

  if (stat.foulsDrawn > 0) {
    addLine(
      lines,
      "fouls_drawn",
      "Was Fouled",
      stat.foulsDrawn,
      stat.foulsDrawn * 1
    );
  }

  if (pos !== "GK" && stat.duelsWon > 0) {
    const divisor = AERIAL_WON_DIVISOR[pos] ?? 4;
    const aerialPoints = Math.floor(stat.duelsWon / divisor);
    if (aerialPoints > 0) {
      addLine(
        lines,
        "aerial_won",
        "Aerial Duels Won",
        stat.duelsWon,
        aerialPoints
      );
    }
  }

  if (pos !== "GK" && stat.duelsLost > 0) {
    const lostPoints = -Math.floor(stat.duelsLost / 2);
    addLine(
      lines,
      "aerial_lost",
      "Aerial Battles Lost",
      stat.duelsLost,
      lostPoints,
      negScale
    );
  }

  if (stat.foulsCommitted > 0) {
    addLine(
      lines,
      "fouls_committed",
      "Fouls Committed",
      stat.foulsCommitted,
      stat.foulsCommitted * -1,
      negScale
    );
  }

  if (stat.yellowCards > 0) {
    addLine(
      lines,
      "yellow",
      "Yellow cards",
      stat.yellowCards,
      stat.yellowCards * -2,
      negScale
    );
  }

  if (stat.redCards > 0) {
    addLine(
      lines,
      "red",
      "Red card",
      stat.redCards,
      stat.redCards * -8,
      negScale
    );
  }

  if (
    (pos === "GK" || pos === "DEF") &&
    stat.goalsConceded >= 2 &&
    stat.minutes >= 55
  ) {
    addLine(
      lines,
      "goals_conceded_extra",
      "GK/DF extra goals conceded",
      1,
      -2,
      negScale
    );
  }

  const total = lines.reduce((sum, line) => sum + line.points, 0);
  return { total, lines };
}

export function mergeBreakdownLines(
  lineSets: ScoringBreakdownLine[][]
): ScoringBreakdownLine[] {
  const merged = new Map<string, ScoringBreakdownLine>();
  for (const lines of lineSets) {
    for (const line of lines) {
      const existing = merged.get(line.id);
      if (existing) {
        existing.count += line.count;
        existing.points += line.points;
      } else {
        merged.set(line.id, { ...line });
      }
    }
  }
  return Array.from(merged.values());
}

export function scoreGameweekStatLines(
  lines: ScoringStatInput[],
  options: ScoringOptions = {}
): { total: number; lines: ScoringBreakdownLine[] } {
  const breakdownSets = lines.map((line) =>
    calculatePlayerPointsWithBreakdown(line, options)
  );
  const merged = mergeBreakdownLines(breakdownSets.map((b) => b.lines));
  const total = breakdownSets.reduce((sum, b) => sum + b.total, 0);
  return { total, lines: merged };
}

export function applyCaptainToBreakdown(
  result: { total: number; lines: ScoringBreakdownLine[] },
  isCaptain: boolean
): { total: number; lines: ScoringBreakdownLine[] } {
  if (!isCaptain || result.total === 0) {
    return result;
  }
  return {
    total: result.total * 2,
    lines: [
      ...result.lines,
      {
        id: "captain",
        label: "Capitán (×2 total)",
        count: 1,
        points: result.total,
      },
    ],
  };
}
