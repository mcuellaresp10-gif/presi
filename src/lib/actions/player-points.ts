"use server";

import { getUserClub } from "@/lib/actions/club";
import { DEFAULT_SEASON } from "@/lib/api-football/client";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type PlayerGameweekPointsRow = {
  gameweekId: string;
  round: number;
  season: number;
  points: number;
  minutes: number;
  source: "starter" | "bench_sub" | "bench_boost" | null;
  isCaptain: boolean;
  clubNombre?: string | null;
};

export type PlayerPointsHistory = {
  playerId: string;
  total: number;
  gameweeks: PlayerGameweekPointsRow[];
};

type GwMeta = { id: string; round: number; season: number };

/**
 * Fantasy points history for a player on one club (fast: ~1 small query).
 * Without clubId → current user's club only (never scans all clubs).
 */
export async function getPlayerPointsHistory(
  playerId: string,
  clubId?: string | null,
  season: number = DEFAULT_SEASON
): Promise<PlayerPointsHistory> {
  const empty: PlayerPointsHistory = {
    playerId,
    total: 0,
    gameweeks: [],
  };
  if (!playerId) return empty;

  const myClub = await getUserClub();
  if (!myClub) return empty;

  const targetClubId = clubId || myClub.id;
  const foreignClub = targetClubId !== myClub.id;

  let supabase;
  if (foreignClub) {
    try {
      supabase = createServiceRoleClient();
    } catch {
      return empty;
    }
  } else {
    supabase = await createClient();
  }

  const [{ data: gwRows }, { data: pointRows, error }] = await Promise.all([
    supabase
      .from("gameweeks")
      .select("id, round, season")
      .eq("season", season),
    supabase
      .from("club_gameweek_points")
      .select("gameweek_id, breakdown")
      .eq("club_id", targetClubId),
  ]);

  if (error) {
    console.error("getPlayerPointsHistory failed:", error.message);
    return empty;
  }

  const gwMap = new Map<string, GwMeta>();
  for (const gw of gwRows ?? []) {
    gwMap.set(gw.id, {
      id: gw.id,
      round: gw.round,
      season: gw.season,
    });
  }

  const byGw = new Map<string, PlayerGameweekPointsRow>();

  for (const row of pointRows ?? []) {
    const gw = gwMap.get(row.gameweek_id as string);
    if (!gw) continue;

    const breakdown = row.breakdown;
    if (!Array.isArray(breakdown)) continue;

    for (const entry of breakdown as Array<{
      playerId?: string;
      points?: number;
      minutes?: number;
      source?: "starter" | "bench_sub" | "bench_boost";
      isCaptain?: boolean;
    }>) {
      if (entry.playerId !== playerId) continue;
      if (typeof entry.points !== "number") continue;

      const existing = byGw.get(gw.id);
      if (existing) {
        existing.points += entry.points;
        existing.minutes = Math.max(existing.minutes, entry.minutes ?? 0);
        existing.isCaptain = existing.isCaptain || !!entry.isCaptain;
      } else {
        byGw.set(gw.id, {
          gameweekId: gw.id,
          round: gw.round,
          season: gw.season,
          points: entry.points,
          minutes: entry.minutes ?? 0,
          source: entry.source ?? null,
          isCaptain: !!entry.isCaptain,
        });
      }
    }
  }

  const gameweeks = Array.from(byGw.values()).sort((a, b) => {
    if (a.season !== b.season) return b.season - a.season;
    return b.round - a.round;
  });

  return {
    playerId,
    total: gameweeks.reduce((sum, row) => sum + row.points, 0),
    gameweeks,
  };
}
