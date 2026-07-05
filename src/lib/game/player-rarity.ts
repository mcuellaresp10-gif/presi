import type { Position, Rarity } from "./types";

export const MIN_PLAYER_COST = 500_000;
export const MAX_PLAYER_COST = 5_000_000;
export const MIN_MINUTES_FOR_PREMIUM_TIER = 90;

/** Cumulative share from bottom: bronce, +plata, +oro, +leyenda */
export const TIER_PERCENTILE_SHARES: Record<Rarity, number> = {
  bronce: 0.45,
  plata: 0.3,
  oro: 0.18,
  leyenda: 0.07,
};

export const TIER_COST_RANGE: Record<Rarity, [number, number]> = {
  bronce: [500_000, 1_200_000],
  plata: [1_200_000, 2_000_000],
  oro: [2_000_000, 3_500_000],
  leyenda: [3_500_000, 5_000_000],
};

export const RARITY_ORDER: Rarity[] = ["bronce", "plata", "oro", "leyenda"];

export type PlayerSeasonStats = {
  apiFootballId: number;
  nombre: string;
  equipo: string;
  posicion: Position;
  photo: string | null;
  minutes: number;
  appearances: number;
  goals: number;
  assists: number;
  saves: number;
  goalsConceded: number;
  keyPasses: number;
  tackles: number;
  duelsWon: number;
  rating: number;
};

export type ScoredPlayer = PlayerSeasonStats & {
  performanceScore: number;
};

export type TierAssignment = {
  rareza: Rarity;
  costo_base: number;
  performance_score: number;
};

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function ratio(value: number, target: number, weight: number): number {
  if (target <= 0) return 0;
  return clamp(value / target, 0, 1) * weight;
}

export function computePerformanceScore(stats: PlayerSeasonStats): number {
  const minutesScore = ratio(stats.minutes, 1800, 30);
  const ratingScore =
    stats.rating > 0 ? clamp(stats.rating / 10, 0, 1) * 20 : 8;

  let roleScore = 0;

  switch (stats.posicion) {
    case "GK":
      roleScore =
        ratio(stats.saves, 40, 25) +
        ratio(Math.max(0, 30 - stats.goalsConceded), 30, 15);
      break;
    case "DEF":
      roleScore =
        ratio(stats.tackles, 35, 20) + ratio(stats.duelsWon, 25, 15);
      break;
    case "MED":
      roleScore =
        ratio(stats.keyPasses, 25, 18) + ratio(stats.assists, 8, 12);
      break;
    case "DEL":
      roleScore = ratio(stats.goals, 10, 22) + ratio(stats.assists, 6, 10);
      break;
  }

  const appearanceBonus = ratio(stats.appearances, 15, 5);
  return Math.round(minutesScore + ratingScore + roleScore + appearanceBonus);
}

export function costForTier(
  rareza: Rarity,
  score: number,
  tierMinScore: number,
  tierMaxScore: number
): number {
  const [minCost, maxCost] = TIER_COST_RANGE[rareza];
  if (tierMaxScore <= tierMinScore) return minCost;
  const t = (score - tierMinScore) / (tierMaxScore - tierMinScore);
  return Math.round(minCost + clamp(t, 0, 1) * (maxCost - minCost));
}

function rarityForRank(index: number, total: number): Rarity {
  if (total <= 0) return "bronce";

  const pct = (total - index) / total;
  const leyendaCut = 1 - TIER_PERCENTILE_SHARES.leyenda;
  const oroCut = leyendaCut - TIER_PERCENTILE_SHARES.oro;
  const plataCut = oroCut - TIER_PERCENTILE_SHARES.plata;

  if (pct >= leyendaCut) return "leyenda";
  if (pct >= oroCut) return "oro";
  if (pct >= plataCut) return "plata";
  return "bronce";
}

export function assignTiersFromScores(
  players: ScoredPlayer[]
): Map<number, TierAssignment> {
  const result = new Map<number, TierAssignment>();

  if (players.length === 0) return result;

  const sorted = [...players].sort(
    (a, b) => b.performanceScore - a.performanceScore
  );

  const byRarity = new Map<Rarity, ScoredPlayer[]>();
  for (const rarity of RARITY_ORDER) {
    byRarity.set(rarity, []);
  }

  sorted.forEach((player, index) => {
    let rareza = rarityForRank(index, sorted.length);

    if (
      player.minutes < MIN_MINUTES_FOR_PREMIUM_TIER &&
      (rareza === "oro" || rareza === "leyenda")
    ) {
      rareza = "plata";
    }

    byRarity.get(rareza)!.push(player);
  });

  for (const rarity of RARITY_ORDER) {
    const group = byRarity.get(rarity)!;
    if (group.length === 0) continue;

    const scores = group.map((p) => p.performanceScore);
    const tierMin = Math.min(...scores);
    const tierMax = Math.max(...scores);

    for (const player of group) {
      result.set(player.apiFootballId, {
        rareza: rarity,
        costo_base: costForTier(
          rarity,
          player.performanceScore,
          tierMin,
          tierMax
        ),
        performance_score: player.performanceScore,
      });
    }
  }

  return result;
}

export function getOvrForScore(rareza: Rarity, score: number): number {
  const ranges: Record<Rarity, [number, number]> = {
    bronce: [72, 76],
    plata: [77, 81],
    oro: [82, 86],
    leyenda: [87, 92],
  };
  const [min, max] = ranges[rareza];
  const normalized = clamp(score / 100, 0, 1);
  return Math.round(min + normalized * (max - min));
}

export type ApiLeaguePlayerRow = {
  player: { id: number; name: string; photo: string | null };
  statistics: Array<{
    league?: { id?: number | null } | null;
    games?: {
      minutes?: number | null;
      appearences?: number | null;
      position?: string | null;
    } | null;
    goals?: {
      total?: number | null;
      assists?: number | null;
      conceded?: number | null;
      saves?: number | null;
    } | null;
    passes?: { key?: number | null } | null;
    tackles?: { total?: number | null } | null;
    duels?: { won?: number | null } | null;
    team?: { name?: string | null } | null;
  }>;
};

export function parseApiLeaguePlayerRow(
  row: ApiLeaguePlayerRow,
  leagueId: number,
  mapPosition: (pos: string | null) => Position
): PlayerSeasonStats | null {
  const statsBlocks = row.statistics ?? [];
  const leagueBlock =
    statsBlocks.find((s) => s.league?.id === leagueId) ??
    statsBlocks.find((s) => (s.games?.minutes ?? 0) > 0) ??
    statsBlocks[0];

  if (!leagueBlock) return null;

  const posicion = mapPosition(leagueBlock.games?.position ?? null);
  const equipo = leagueBlock.team?.name ?? "Liga Colombiana";

  return {
    apiFootballId: row.player.id,
    nombre: row.player.name,
    equipo,
    posicion,
    photo: row.player.photo,
    minutes: num(leagueBlock.games?.minutes),
    appearances: num(leagueBlock.games?.appearences),
    goals: num(leagueBlock.goals?.total),
    assists: num(leagueBlock.goals?.assists),
    saves: num(leagueBlock.goals?.saves),
    goalsConceded: num(leagueBlock.goals?.conceded),
    keyPasses: num(leagueBlock.passes?.key),
    tackles: num(leagueBlock.tackles?.total),
    duelsWon: num(leagueBlock.duels?.won),
    rating: 0,
  };
}

export function buildTierAssignmentsFromApiRows(
  rows: ApiLeaguePlayerRow[],
  leagueId: number,
  mapPosition: (pos: string | null) => Position
): Map<number, TierAssignment & PlayerSeasonStats> {
  const parsed: ScoredPlayer[] = [];

  for (const row of rows) {
    const stats = parseApiLeaguePlayerRow(row, leagueId, mapPosition);
    if (!stats) continue;
    parsed.push({
      ...stats,
      performanceScore: computePerformanceScore(stats),
    });
  }

  const tiers = assignTiersFromScores(parsed);
  const combined = new Map<number, TierAssignment & PlayerSeasonStats>();

  for (const player of parsed) {
    const tier = tiers.get(player.apiFootballId) ?? {
      rareza: "bronce" as Rarity,
      costo_base: TIER_COST_RANGE.bronce[0],
      performance_score: player.performanceScore,
    };
    combined.set(player.apiFootballId, { ...player, ...tier });
  }

  return combined;
}
