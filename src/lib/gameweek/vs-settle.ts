import { getAvailableApiPlayerPool } from "@/lib/db/player-pool";
import { getInitialContractFields } from "@/lib/game/contracts";
import { createMathRng } from "@/lib/game/rng";
import { countPositions } from "@/lib/game/roster";
import type { Player } from "@/lib/game/types";
import {
  generateVsStreakPack,
  nextVsWinStreak,
  resolveVsOutcome,
  VS_STREAK_TARGET,
  VS_WIN_GEMS,
  type VsOutcome,
} from "@/lib/game/vs-rewards";
import { isNpcClubEstilo } from "@/lib/gameweek/vs-rival";
import type { SupabaseClient } from "@supabase/supabase-js";

export type VsStreakRewardPayload = {
  wildCardType: string;
  players: Array<{
    id: string;
    nombre: string;
    rareza: string;
    posicion: string;
  }>;
  gemsFromWin: number;
  grantedAt: string;
};

/**
 * Settle jornada VS rewards once the gameweek is finished.
 * Idempotent: rows with settled_at set are skipped.
 */
export async function settleGameweekVsRewards(
  supabase: SupabaseClient,
  gameweekId: string
) {
  const { data: rows } = await supabase
    .from("club_gameweek_vs")
    .select("club_id, rival_club_id, settled_at")
    .eq("gameweek_id", gameweekId)
    .is("settled_at", null);

  if (!rows?.length) return { settled: 0 };

  const clubIds = Array.from(
    new Set(
      rows.flatMap((r) =>
        [r.club_id as string, r.rival_club_id as string | null].filter(
          Boolean
        ) as string[]
      )
    )
  );

  const [{ data: pointsRows }, { data: clubRows }] = await Promise.all([
    supabase
      .from("club_gameweek_points")
      .select("club_id, points")
      .eq("gameweek_id", gameweekId)
      .in("club_id", clubIds),
    supabase
      .from("clubs")
      .select("id, gemas, vs_win_streak, estilo, onboarding_completado")
      .in("id", clubIds),
  ]);

  const pointsByClub = new Map<string, number>();
  for (const row of pointsRows ?? []) {
    pointsByClub.set(row.club_id as string, Number(row.points) || 0);
  }

  const clubById = new Map(
    (clubRows ?? []).map((c) => [c.id as string, c] as const)
  );

  let settled = 0;

  for (const row of rows) {
    const clubId = row.club_id as string;
    const club = clubById.get(clubId);
    if (!club || !club.onboarding_completado) continue;

    const myPoints = pointsByClub.get(clubId) ?? 0;

    if (isNpcClubEstilo(club.estilo as string | null)) {
      await markSettled(supabase, clubId, gameweekId, {
        outcome: "no_rival",
        myPoints,
        rivalPoints: 0,
        gemsAwarded: 0,
        streakAfter: 0,
        streakPackGranted: false,
      });
      settled += 1;
      continue;
    }

    const rivalId = row.rival_club_id as string | null;
    let outcome: VsOutcome = "no_rival";
    let rivalPoints = 0;
    let gemsAwarded = 0;
    let streakAfter = 0;
    let streakPackGranted = false;
    let pendingReward: VsStreakRewardPayload | null = null;

    if (!rivalId) {
      await supabase
        .from("clubs")
        .update({ vs_win_streak: 0 })
        .eq("id", clubId);
    } else {
      rivalPoints = pointsByClub.get(rivalId) ?? 0;
      outcome = resolveVsOutcome(myPoints, rivalPoints);
      streakAfter = nextVsWinStreak(Number(club.vs_win_streak ?? 0), outcome);

      if (outcome === "win") {
        gemsAwarded = VS_WIN_GEMS;
        const newGemas = Number(club.gemas ?? 0) + VS_WIN_GEMS;

        if (streakAfter >= VS_STREAK_TARGET) {
          const pack = await grantVsStreakPack(supabase, clubId, gemsAwarded);
          streakPackGranted = pack.granted;
          pendingReward = pack.payload;
          streakAfter = 0;
        }

        await supabase
          .from("clubs")
          .update({
            gemas: newGemas,
            vs_win_streak: streakAfter,
            ...(pendingReward
              ? { pending_vs_streak_reward: pendingReward }
              : {}),
          })
          .eq("id", clubId);
      } else {
        streakAfter = 0;
        await supabase
          .from("clubs")
          .update({ vs_win_streak: 0 })
          .eq("id", clubId);
      }
    }

    await markSettled(supabase, clubId, gameweekId, {
      outcome,
      myPoints,
      rivalPoints,
      gemsAwarded,
      streakAfter,
      streakPackGranted,
    });
    settled += 1;
  }

  return { settled };
}

async function markSettled(
  supabase: SupabaseClient,
  clubId: string,
  gameweekId: string,
  data: {
    outcome: VsOutcome;
    myPoints: number;
    rivalPoints: number;
    gemsAwarded: number;
    streakAfter: number;
    streakPackGranted: boolean;
  }
) {
  await supabase
    .from("club_gameweek_vs")
    .update({
      my_points: data.myPoints,
      rival_points: data.rivalPoints,
      outcome: data.outcome,
      gems_awarded: data.gemsAwarded,
      streak_after: data.streakAfter,
      streak_pack_granted: data.streakPackGranted,
      settled_at: new Date().toISOString(),
    })
    .eq("club_id", clubId)
    .eq("gameweek_id", gameweekId);
}

async function grantVsStreakPack(
  supabase: SupabaseClient,
  clubId: string,
  gemsFromWin: number
): Promise<{ granted: boolean; payload: VsStreakRewardPayload }> {
  const { data: rosterRows } = await supabase
    .from("club_roster")
    .select("player_id, players_master(*)")
    .eq("club_id", clubId);

  const roster = (rosterRows ?? []).map(
    (r) => r.players_master as unknown as Player
  );
  const counts = countPositions(roster);
  const pool = await getAvailableApiPlayerPool(supabase, roster);
  const pack = generateVsStreakPack(pool, counts, 8, createMathRng(), "oro");

  await supabase.from("club_wild_cards").insert({
    club_id: clubId,
    card_type: pack.wildCardType,
    status: "available",
  });

  const grantedPlayers: VsStreakRewardPayload["players"] = [];

  for (const player of pack.players) {
    const { error } = await supabase.from("club_roster").insert({
      club_id: clubId,
      player_id: player.id,
      es_titular: false,
      ...getInitialContractFields(player.rareza, false),
    });
    if (!error) {
      grantedPlayers.push({
        id: player.id,
        nombre: player.nombre,
        rareza: player.rareza,
        posicion: player.posicion,
      });
      counts[player.posicion] += 1;
    }
  }

  return {
    granted: true,
    payload: {
      wildCardType: pack.wildCardType,
      players: grantedPlayers,
      gemsFromWin,
      grantedAt: new Date().toISOString(),
    },
  };
}
