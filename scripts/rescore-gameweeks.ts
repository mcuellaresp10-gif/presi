/**
 * Rescore live gameweeks from DB stats (no API fetch, no React/server actions).
 *   npx tsx scripts/rescore-gameweeks.ts
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  buildStatsMapFromRows,
  computeEffectiveLineup,
  matchStatLineFromRow,
} from "../src/lib/game/effective-lineup";
import {
  applyGymGameweekBonus,
  getMedicalPenaltyReduction,
} from "../src/lib/game/facility-effects";
import {
  aggregateGameweekStats,
  calculateClubGameweekPoints,
  type MatchStatLine,
} from "../src/lib/game/scoring";
import { NPC_CLUB_ESTILO } from "../src/lib/game/npc";
import type { Player } from "../src/lib/game/types";

for (const f of [".env.local", ".env"]) {
  const p = resolve(f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function scoreGameweek(gameweekId: string) {
  const { data: snapshots } = await sb
    .from("lineup_snapshots")
    .select("*")
    .eq("gameweek_id", gameweekId);

  const { data: statRows } = await sb
    .from("player_match_stats")
    .select(
      `player_id, minutes, goals, assists, yellow_cards, red_cards, goals_conceded,
       started, team_result, saves, passes_accurate, tackles_won, dribbles_success,
       key_passes, big_chances_created, fouls_drawn, duels_won, duels_lost, fouls_committed,
       players_master(posicion)`
    )
    .eq("gameweek_id", gameweekId);

  const rawStats: MatchStatLine[] = (statRows ?? []).map((row) =>
    matchStatLineFromRow({
      player_id: row.player_id,
      posicion: (
        row.players_master as unknown as { posicion: Player["posicion"] }
      ).posicion,
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
    })
  );

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
    const { data: rosterRows } = await sb
      .from("club_roster")
      .select("player_id, players_master(*)")
      .eq("club_id", snap.club_id);

    const playersById = new Map<string, Player>();
    for (const row of rosterRows ?? []) {
      const p = row.players_master as unknown as Player;
      playersById.set(p.id, p);
    }

    const { data: facilities } = await sb
      .from("facilities")
      .select("tipo, nivel")
      .eq("club_id", snap.club_id)
      .in("tipo", ["cuerpo_medico", "gimnasio"]);

    const medicoNivel =
      facilities?.find((f) => f.tipo === "cuerpo_medico")?.nivel ?? 1;
    const gymNivel = facilities?.find((f) => f.tipo === "gimnasio")?.nivel ?? 1;
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
      { penaltyReduction }
    );

    let totalPoints = calculateClubGameweekPoints(effective.scoringPlayers);
    totalPoints = applyGymGameweekBonus(totalPoints, gymNivel);

    await sb.from("club_gameweek_points").upsert({
      club_id: snap.club_id,
      gameweek_id: gameweekId,
      points: totalPoints,
      breakdown: effective.scoringPlayers,
      calculated_at: new Date().toISOString(),
    });
    clubsProcessed += 1;
  }

  const { data: gw } = await sb
    .from("gameweeks")
    .select("season")
    .eq("id", gameweekId)
    .single();

  if (gw) {
    const { data: gameweeks } = await sb
      .from("gameweeks")
      .select("id")
      .eq("season", gw.season);
    const gwIds = (gameweeks ?? []).map((g) => g.id);
    const { data: points } = await sb
      .from("club_gameweek_points")
      .select("club_id, points")
      .in("gameweek_id", gwIds);
    const totals = new Map<string, number>();
    for (const row of points ?? []) {
      totals.set(
        row.club_id,
        (totals.get(row.club_id) ?? 0) + (Number(row.points) || 0)
      );
    }
    for (const [clubId, total] of Array.from(totals.entries())) {
      await sb.from("club_season_points").upsert(
        {
          club_id: clubId,
          season: gw.season,
          total_points: total,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "club_id,season" }
      );
    }
  }

  return clubsProcessed;
}

async function main() {
  const { data: live } = await sb
    .from("gameweeks")
    .select("id, round")
    .eq("status", "live");

  for (const gw of live ?? []) {
    console.log(`Scoring J${gw.round}…`);
    const n = await scoreGameweek(gw.id);
    console.log(`  clubs: ${n}`);

    const { data: npcs } = await sb
      .from("clubs")
      .select("id")
      .eq("estilo", NPC_CLUB_ESTILO);
    const ids = (npcs ?? []).map((c) => c.id);
    const { data: pts } = await sb
      .from("club_gameweek_points")
      .select("points")
      .eq("gameweek_id", gw.id)
      .in("club_id", ids);
    const scoring = (pts ?? []).filter((p) => Number(p.points) > 0).length;
    const sum = (pts ?? []).reduce((a, p) => a + (Number(p.points) || 0), 0);
    console.log(`  NPC points>0: ${scoring}/${ids.length}, sum=${sum}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
