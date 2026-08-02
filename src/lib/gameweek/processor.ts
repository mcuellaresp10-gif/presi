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
import { snapshotVsRivalsForGameweek } from "@/lib/gameweek/vs-rival";
import { settleGameweekVsRewards } from "@/lib/gameweek/vs-settle";
import {
  applyGymGameweekBonus,
  getMedicalPenaltyReduction,
} from "@/lib/game/facility-effects";
import { NPC_CLUB_ESTILO } from "@/lib/game/npc";
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

type RosterLockRow = {
  player_id: string;
  squad_role?: string | null;
  es_titular?: boolean | null;
  players_master: unknown;
};

function lineupFromRosterRoles(rosterRows: RosterLockRow[]): {
  starterIds: string[];
  benchIds: string[];
} {
  const starters = rosterRows
    .filter(
      (r) => r.squad_role === "starter" || (!r.squad_role && r.es_titular)
    )
    .map((r) => r.player_id);
  const bench = rosterRows
    .filter((r) => r.squad_role === "bench")
    .map((r) => r.player_id);
  return { starterIds: starters, benchIds: bench };
}

function resolveLockedLineup(
  draft: {
    starter_ids?: unknown;
    bench_ids?: unknown;
    captain_id?: unknown;
    formation?: unknown;
  } | null,
  rosterRows: RosterLockRow[],
  previousSnap: {
    starter_ids?: unknown;
    bench_ids?: unknown;
    captain_id?: unknown;
    formation?: unknown;
  } | null
): {
  starterIds: string[];
  benchIds: string[];
  captainId: string | null;
  formation: string | null;
  isValid: boolean;
} {
  const rosterPlayers = rosterRows.map(
    (r) => r.players_master as unknown as Player
  );

  const candidates: Array<{
    starterIds: string[];
    benchIds: string[];
    captainId: string | null;
    formation: string | null;
  }> = [];

  if (draft) {
    candidates.push({
      starterIds: (draft.starter_ids as string[]) ?? [],
      benchIds: (draft.bench_ids as string[]) ?? [],
      captainId: (draft.captain_id as string | null) ?? null,
      formation: (draft.formation as string | null) ?? null,
    });
  }
  if (previousSnap) {
    candidates.push({
      starterIds: (previousSnap.starter_ids as string[]) ?? [],
      benchIds: (previousSnap.bench_ids as string[]) ?? [],
      captainId: (previousSnap.captain_id as string | null) ?? null,
      formation: (previousSnap.formation as string | null) ?? null,
    });
  }
  const fromRoster = lineupFromRosterRoles(rosterRows);
  candidates.push({
    starterIds: fromRoster.starterIds,
    benchIds: fromRoster.benchIds,
    captainId: fromRoster.starterIds[0] ?? null,
    formation: null,
  });

  for (const candidate of candidates) {
    if (!candidate.starterIds.length) continue;

    const sanitized = sanitizeLineupDraft(
      candidate.starterIds,
      candidate.benchIds,
      candidate.captainId,
      rosterPlayers
    );
    if (!sanitized.ok) continue;

    const validation = validateLineupDraft(
      sanitized.starterIds,
      sanitized.benchIds,
      rosterPlayers
    );

    return {
      starterIds: sanitized.starterIds,
      benchIds: sanitized.benchIds,
      captainId:
        sanitized.captainId ??
        (sanitized.starterIds.length > 0 ? sanitized.starterIds[0] : null),
      formation: validation.ok
        ? validation.formation
        : sanitized.formation ?? candidate.formation,
      isValid: validation.ok,
    };
  }

  return {
    starterIds: [],
    benchIds: [],
    captainId: null,
    formation: null,
    isValid: false,
  };
}

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
      .select("club_id, starter_ids, is_valid")
      .eq("club_id", club.id)
      .eq("gameweek_id", gameweek.id)
      .maybeSingle();

    const existingStarters = (existing?.starter_ids as string[] | null) ?? [];
    // Empty snapshots (common for NPC bots after a new GW) must be repaired.
    if (existing && existingStarters.length > 0) continue;

    const [{ data: draft }, { data: rosterRows }, { data: prevSnap }] =
      await Promise.all([
        supabase
          .from("lineup_drafts")
          .select("*")
          .eq("club_id", club.id)
          .eq("gameweek_id", gameweek.id)
          .maybeSingle(),
        supabase
          .from("club_roster")
          .select("player_id, squad_role, es_titular, players_master(*)")
          .eq("club_id", club.id),
        supabase
          .from("lineup_snapshots")
          .select("starter_ids, bench_ids, captain_id, formation")
          .eq("club_id", club.id)
          .neq("gameweek_id", gameweek.id)
          .order("locked_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const resolved = resolveLockedLineup(
      draft,
      (rosterRows ?? []) as RosterLockRow[],
      prevSnap
    );

    const payload = {
      club_id: club.id,
      gameweek_id: gameweek.id,
      starter_ids: resolved.starterIds,
      bench_ids: resolved.benchIds,
      captain_id: resolved.captainId,
      formation: resolved.formation,
      is_valid: resolved.isValid,
      locked_at: now.toISOString(),
    };

    if (existing) {
      await supabase
        .from("lineup_snapshots")
        .update(payload)
        .eq("club_id", club.id)
        .eq("gameweek_id", gameweek.id);
    } else {
      await supabase.from("lineup_snapshots").insert(payload);
    }

    // Persist draft so next GW can carry forward from this lineup.
    if (resolved.starterIds.length > 0) {
      await supabase.from("lineup_drafts").upsert(
        {
          club_id: club.id,
          gameweek_id: gameweek.id,
          starter_ids: resolved.starterIds,
          bench_ids: resolved.benchIds,
          captain_id: resolved.captainId,
          formation: resolved.formation,
          updated_at: now.toISOString(),
        },
        { onConflict: "club_id,gameweek_id" }
      );
    }

    locked += 1;
  }

  await snapshotVsRivalsForGameweek(supabase, gameweek.id);

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
  const npcClubIds = new Set<string>();
  {
    const clubIds = Array.from(
      new Set((snapshots ?? []).map((s) => s.club_id as string))
    );
    if (clubIds.length > 0) {
      const { data: clubRows } = await supabase
        .from("clubs")
        .select("id, estilo")
        .in("id", clubIds);
      for (const row of clubRows ?? []) {
        if (row.estilo === NPC_CLUB_ESTILO) npcClubIds.add(row.id);
      }
    }
  }

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

    const { data: facilities } = await supabase
      .from("facilities")
      .select("tipo, nivel")
      .eq("club_id", snap.club_id)
      .in("tipo", ["cuerpo_medico", "gimnasio"]);

    const medicoNivel =
      facilities?.find((f) => f.tipo === "cuerpo_medico")?.nivel ?? 1;
    const gymNivel =
      facilities?.find((f) => f.tipo === "gimnasio")?.nivel ?? 1;

    const penaltyReduction = getMedicalPenaltyReduction(medicoNivel);

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
    totalPoints = applyGymGameweekBonus(totalPoints, gymNivel);

    await supabase.from("club_gameweek_points").upsert({
      club_id: snap.club_id,
      gameweek_id: gameweekId,
      points: totalPoints,
      breakdown: effective.scoringPlayers,
      calculated_at: new Date().toISOString(),
    });

    for (const playerId of effective.contractPlayerIds) {
      if (wildEffects.contractShield) continue;
      if (npcClubIds.has(snap.club_id)) continue;
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

    if (!npcClubIds.has(snap.club_id)) {
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
    }

    if (!npcClubIds.has(snap.club_id)) {
      await tickLoanPlayersForGameweek(supabase, snap.club_id);
    }

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

  // Catch-up: settle VS if this GW is already finished (status flip may have been missed).
  const { data: gwStatus } = await supabase
    .from("gameweeks")
    .select("status")
    .eq("id", gameweekId)
    .maybeSingle();
  if (gwStatus?.status === "finished") {
    await snapshotVsRivalsForGameweek(supabase, gameweekId);
    await settleGameweekVsRewards(supabase, gameweekId);
  }

  return { clubsProcessed };
}

export async function refreshSeasonTotals(
  supabase: SupabaseClient,
  season: number
) {
  const resolvedSeason = Number(season);
  if (!Number.isFinite(resolvedSeason) || resolvedSeason <= 0) return;

  const { data: gameweeks } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("season", resolvedSeason);

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
      (totals.get(row.club_id) ?? 0) + (Number(row.points) || 0)
    );
  }

  for (const [clubId, total] of Array.from(totals.entries())) {
    await supabase.from("club_season_points").upsert(
      {
        club_id: clubId,
        season: resolvedSeason,
        total_points: total,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "club_id,season" }
    );
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
      const { error: statusError } = await supabase
        .from("gameweeks")
        .update({ status })
        .eq("id", gw.id);
      if (statusError) {
        console.error("tickGameweekStatuses update failed", gw.id, statusError);
        continue;
      }
      if (status === "finished" && gw.status !== "finished") {
        try {
          await markFinishedGameweekWildCards(supabase, gw.id);
          // Ensure rivals exist even if lock ran before VS feature shipped.
          await snapshotVsRivalsForGameweek(supabase, gw.id);
          await settleGameweekVsRewards(supabase, gw.id);
        } catch (error) {
          // Don't block status/scoring if VS settlement fails.
          console.error("gameweek finish side-effects failed", gw.id, error);
        }
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
