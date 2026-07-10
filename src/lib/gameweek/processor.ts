import {
  buildStatsMapFromRows,
  computeEffectiveLineup,
  matchStatLineFromRow,
} from "@/lib/game/effective-lineup";
import { effectsFromActiveCards } from "@/lib/game/wild-cards";
import { tickLoanPlayersForGameweek } from "@/lib/actions/loans";
import {
  getActiveGameweekWildCardsForClub,
  markFinishedGameweekWildCards,
} from "@/lib/actions/wild-cards";
import {
  calculateClubGameweekPoints,
  aggregateGameweekStats,
  type MatchStatLine,
} from "@/lib/game/scoring";
import {
  sanitizeLineupDraft,
  validateLineupDraft,
} from "@/lib/game/squad-limits";
import { deriveGameweekStatus } from "@/lib/gameweek/status";
import { getMedicalPenaltyReduction } from "@/lib/game/facility-effects";
import type { Player } from "@/lib/game/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type GameweekRow = {
  id: string;
  season: number;
  round: number;
  first_kickoff_at: string;
  last_kickoff_at: string | null;
  status: string;
};

export async function lockLineupSnapshots(
  supabase: SupabaseClient,
  gameweek: GameweekRow,
  now = new Date()
) {
  if (new Date(gameweek.first_kickoff_at).getTime() > now.getTime()) {
    return { locked: 0 };
  }

  const { data: clubs } = await supabase.from("clubs").select("id");
  let locked = 0;

  for (const club of clubs ?? []) {
    const { data: existing } = await supabase
      .from("lineup_snapshots")
      .select("club_id")
      .eq("club_id", club.id)
      .eq("gameweek_id", gameweek.id)
      .maybeSingle();

    if (existing) continue;

    const { data: draft } = await supabase
      .from("lineup_drafts")
      .select("*")
      .eq("club_id", club.id)
      .eq("gameweek_id", gameweek.id)
      .maybeSingle();

    const { data: rosterRows } = await supabase
      .from("club_roster")
      .select("player_id, players_master(*)")
      .eq("club_id", club.id);

    const rosterPlayers = (rosterRows ?? []).map(
      (r) => r.players_master as unknown as Player
    );

    let isValid = false;
    let starterIds: string[] = [];
    let benchIds: string[] = [];
    let formation: string | null = null;
    let captainId: string | null = null;

    if (draft) {
      const sanitized = sanitizeLineupDraft(
        (draft.starter_ids as string[]) ?? [],
        (draft.bench_ids as string[]) ?? [],
        (draft.captain_id as string | null) ?? null,
        rosterPlayers
      );
      if (sanitized.ok) {
        starterIds = sanitized.starterIds;
        benchIds = sanitized.benchIds;
        formation = sanitized.formation;

        // Only keep an explicit captain who is still a starter — no auto-pick on lock.
        const draftCaptain = (draft.captain_id as string | null) ?? null;
        captainId =
          draftCaptain && starterIds.includes(draftCaptain)
            ? draftCaptain
            : null;

        const validation = validateLineupDraft(
          starterIds,
          benchIds,
          rosterPlayers
        );
        if (validation.ok) {
          isValid = true;
          formation = validation.formation;
          // Complete lineup: ensure there is a captain (fallback to first starter).
          if (!captainId && starterIds.length > 0) {
            captainId = starterIds[0];
          }
        }
      }
    }

    await supabase.from("lineup_snapshots").insert({
      club_id: club.id,
      gameweek_id: gameweek.id,
      starter_ids: starterIds,
      bench_ids: benchIds,
      captain_id: captainId,
      formation,
      is_valid: isValid,
      locked_at: now.toISOString(),
    });

    locked += 1;
  }

  return { locked };
}

export async function processGameweekPointsAndContracts(
  supabase: SupabaseClient,
  gameweekId: string
) {
  const { data: snapshots } = await supabase
    .from("lineup_snapshots")
    .select("*")
    .eq("gameweek_id", gameweekId);

  const { data: statRows } = await supabase
    .from("player_match_stats")
    .select(
      `player_id, minutes, goals, assists, yellow_cards, red_cards, goals_conceded,
       started, team_result, saves, passes_accurate, tackles_won, dribbles_success,
       key_passes, big_chances_created, fouls_drawn, duels_won, duels_lost, fouls_committed,
       players_master(posicion)`
    )
    .eq("gameweek_id", gameweekId);

  const rawStats: MatchStatLine[] = (statRows ?? []).map((row) => ({
    ...matchStatLineFromRow({
      player_id: row.player_id,
      posicion: (row.players_master as unknown as { posicion: Player["posicion"] })
        .posicion,
      minutes: row.minutes,
      goals: row.goals,
      assists: row.assists,
      yellow_cards: row.yellow_cards,
      red_cards: row.red_cards,
      goals_conceded: row.goals_conceded,
      started: row.started,
      team_result: row.team_result,
      saves: row.saves,
      passes_accurate: row.passes_accurate,
      tackles_won: row.tackles_won,
      dribbles_success: row.dribbles_success,
      key_passes: row.key_passes,
      big_chances_created: row.big_chances_created,
      fouls_drawn: row.fouls_drawn,
      duels_won: row.duels_won,
      duels_lost: row.duels_lost,
      fouls_committed: row.fouls_committed,
    }),
  }));

  const aggregated = aggregateGameweekStats(rawStats);
  const statsForMap = Array.from(aggregated.values()).map((s) => ({
    player_id: s.playerId,
    posicion: s.posicion,
    minutes: s.minutes,
    goals: s.goals,
    assists: s.assists,
    yellow_cards: s.yellowCards,
    red_cards: s.redCards,
    goals_conceded: s.goalsConceded,
    started: s.started,
    team_result: s.teamResult,
    saves: s.saves,
    passes_accurate: s.passesAccurate,
    tackles_won: s.tacklesWon,
    dribbles_success: s.dribblesSuccess,
    key_passes: s.keyPasses,
    big_chances_created: s.bigChancesCreated,
    fouls_drawn: s.foulsDrawn,
    duels_won: s.duelsWon,
    duels_lost: s.duelsLost,
    fouls_committed: s.foulsCommitted,
  }));
  const statsMap = buildStatsMapFromRows(statsForMap);
  for (const line of Array.from(aggregated.values())) {
    const mapped = statsMap.get(line.playerId);
    if (!mapped) continue;
    mapped.teamWinCount = line.teamWinCount;
    mapped.teamDrawCount = line.teamDrawCount;
    mapped.startedMatchCount = line.startedMatchCount;
  }

  let clubsProcessed = 0;

  for (const snap of snapshots ?? []) {
    const { data: rosterRows } = await supabase
      .from("club_roster")
      .select("player_id, players_master(*)")
      .eq("club_id", snap.club_id);

    const playersById = new Map<string, Player>();
    for (const row of rosterRows ?? []) {
      const p = row.players_master as unknown as Player;
      playersById.set(p.id, p);
    }

    const activeCardTypes = await getActiveGameweekWildCardsForClub(
      supabase,
      snap.club_id,
      gameweekId
    );
    const wildEffects = effectsFromActiveCards(activeCardTypes);

    const { data: medico } = await supabase
      .from("facilities")
      .select("nivel")
      .eq("club_id", snap.club_id)
      .eq("tipo", "cuerpo_medico")
      .maybeSingle();

    const penaltyReduction = getMedicalPenaltyReduction(medico?.nivel ?? 1);

    const effective = computeEffectiveLineup(
      {
        starterIds: snap.starter_ids as string[],
        benchIds: snap.bench_ids as string[],
        captainId: (snap.captain_id as string | null) ?? null,
        isValid: snap.is_valid,
      },
      playersById,
      statsMap,
      { benchBoost: wildEffects.benchBoost, penaltyReduction }
    );

    let totalPoints = calculateClubGameweekPoints(effective.scoringPlayers);
    if (wildEffects.doubleGameweek) {
      totalPoints *= 2;
    }

    await supabase.from("club_gameweek_points").upsert({
      club_id: snap.club_id,
      gameweek_id: gameweekId,
      points: totalPoints,
      breakdown: effective.scoringPlayers,
      calculated_at: new Date().toISOString(),
    });

    for (const playerId of effective.contractPlayerIds) {
      if (wildEffects.contractShield) continue;
      const { data: already } = await supabase
        .from("contract_gameweek_log")
        .select("player_id")
        .eq("club_id", snap.club_id)
        .eq("gameweek_id", gameweekId)
        .eq("player_id", playerId)
        .maybeSingle();

      if (already) continue;

      const { data: rosterRow } = await supabase
        .from("club_roster")
        .select("jornadas_restantes, es_prestamo")
        .eq("club_id", snap.club_id)
        .eq("player_id", playerId)
        .maybeSingle();

      if (rosterRow?.es_prestamo) continue;

      if (rosterRow) {
        await supabase
          .from("club_roster")
          .update({
            jornadas_restantes: Math.max(
              0,
              (rosterRow.jornadas_restantes ?? 1) - 1
            ),
          })
          .eq("club_id", snap.club_id)
          .eq("player_id", playerId);
      }

      await supabase.from("contract_gameweek_log").insert({
        club_id: snap.club_id,
        gameweek_id: gameweekId,
        player_id: playerId,
      });
    }

    const { data: expiredRows } = await supabase
      .from("club_roster")
      .select("player_id")
      .eq("club_id", snap.club_id)
      .eq("es_prestamo", false)
      .lte("jornadas_restantes", 0);

    for (const row of expiredRows ?? []) {
      await supabase
        .from("club_roster")
        .delete()
        .eq("club_id", snap.club_id)
        .eq("player_id", row.player_id);
    }

    await tickLoanPlayersForGameweek(supabase, snap.club_id);

    clubsProcessed += 1;
  }

  const { data: gw } = await supabase
    .from("gameweeks")
    .select("season")
    .eq("id", gameweekId)
    .single();

  if (gw) {
    await refreshSeasonTotals(supabase, gw.season);
  }

  return { clubsProcessed };
}

export async function refreshSeasonTotals(
  supabase: SupabaseClient,
  season: number
) {
  const { data: gameweeks } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("season", season);

  const gwIds = (gameweeks ?? []).map((g) => g.id);
  if (gwIds.length === 0) return;

  const { data: points } = await supabase
    .from("club_gameweek_points")
    .select("club_id, points, gameweek_id")
    .in("gameweek_id", gwIds);

  const totals = new Map<string, number>();
  for (const row of points ?? []) {
    totals.set(
      row.club_id,
      (totals.get(row.club_id) ?? 0) + Number(row.points)
    );
  }

  for (const [clubId, total] of Array.from(totals.entries())) {
    await supabase.from("club_season_points").upsert({
      club_id: clubId,
      season,
      total_points: total,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function tickGameweekStatuses(
  supabase: SupabaseClient,
  now = new Date()
) {
  const { data: gameweeks } = await supabase.from("gameweeks").select("*");

  for (const gw of gameweeks ?? []) {
    const status = deriveGameweekStatus(
      gw.first_kickoff_at,
      gw.last_kickoff_at,
      now
    );

    if (status !== gw.status) {
      await supabase.from("gameweeks").update({ status }).eq("id", gw.id);
      if (status === "finished" && gw.status !== "finished") {
        await markFinishedGameweekWildCards(supabase, gw.id);
      }
      gw.status = status;
    }

    if (now.getTime() >= new Date(gw.first_kickoff_at).getTime()) {
      await lockLineupSnapshots(supabase, gw, now);
    }
  }
}

/** @deprecated Prefer tickGameweekStatuses + processGameweekPointsAndContracts */
export async function updateGameweekStatuses(
  supabase: SupabaseClient,
  now = new Date()
) {
  await tickGameweekStatuses(supabase, now);

  const { data: gameweeks } = await supabase
    .from("gameweeks")
    .select("id, status")
    .in("status", ["live", "finished"]);

  for (const gw of gameweeks ?? []) {
    await processGameweekPointsAndContracts(supabase, gw.id);
  }
}
