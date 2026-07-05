/**
 * Reporte de distribución de rareza/costos y sync opcional desde API-Football.
 *
 * Invocado por scripts/evaluate-player-tiers.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_LEAGUE_ID,
  DEFAULT_SEASON,
  fetchLeaguePlayersPage,
  isApiFootballConfigured,
  mapApiPosition,
} from "@/lib/api-football/client";
import {
  buildTierAssignmentsFromApiRows,
  TIER_COST_RANGE,
  TIER_PERCENTILE_SHARES,
} from "@/lib/game/player-rarity";
import type { Rarity } from "@/lib/game/types";

const apply = process.argv.includes("--apply");

const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));

if (envPath) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const leagueId = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? DEFAULT_LEAGUE_ID);
const season = Number(process.env.API_FOOTBALL_SEASON ?? DEFAULT_SEASON);

const TIERS: Rarity[] = ["bronce", "plata", "oro", "leyenda"];

function printDistribution(
  label: string,
  counts: Partial<Record<Rarity, number>>,
  total: number
) {
  console.log(`\n${label} (n=${total})`);
  for (const tier of TIERS) {
    const n = counts[tier] ?? 0;
    const pct = total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";
    const target = (TIER_PERCENTILE_SHARES[tier] * 100).toFixed(0);
    console.log(
      `  ${tier.padEnd(8)} ${String(n).padStart(4)}  ${pct.padStart(5)}%  (obj ~${target}%)`
    );
  }
}

function summarizeCosts(
  assignments: ReturnType<typeof buildTierAssignmentsFromApiRows>
) {
  const byTier: Record<Rarity, number[]> = {
    bronce: [],
    plata: [],
    oro: [],
    leyenda: [],
  };
  for (const row of Array.from(assignments.values())) {
    byTier[row.rareza].push(row.costo_base);
  }
  console.log("\nRangos de costo (API):");
  for (const tier of TIERS) {
    const costs = byTier[tier];
    if (!costs.length) {
      console.log(`  ${tier}: —`);
      continue;
    }
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    const [expMin, expMax] = TIER_COST_RANGE[tier];
    console.log(
      `  ${tier}: $${(min / 1e6).toFixed(2)}M – $${(max / 1e6).toFixed(2)}M  (obj $${(expMin / 1e6).toFixed(1)}–$${(expMax / 1e6).toFixed(1)}M)`
    );
  }
}

async function fetchAllLeaguePlayers() {
  const allRows = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const { players, paging } = await fetchLeaguePlayersPage(
      leagueId,
      season,
      page
    );
    if (!players.length) break;
    allRows.push(...players);
    totalPages = paging.total;
    console.log(`  página ${page}/${totalPages} (${allRows.length} jugadores)`);
    page += 1;
  }

  return allRows;
}

async function reportDb(
  supabase: ReturnType<typeof createClient>
) {
  const { data, error } = await supabase
    .from("players_master")
    .select("rareza, costo_base")
    .not("api_football_id", "is", null);

  if (error) {
    console.error("Error leyendo players_master:", error.message);
    return;
  }

  const counts: Partial<Record<Rarity, number>> = {};
  for (const row of data ?? []) {
    const rareza = row.rareza as Rarity;
    counts[rareza] = (counts[rareza] ?? 0) + 1;
  }
  printDistribution("Base de datos actual", counts, data?.length ?? 0);
}

async function applyAssignments(
  supabase: ReturnType<typeof createClient>,
  assignments: ReturnType<typeof buildTierAssignmentsFromApiRows>
) {
  const now = new Date().toISOString();
  let synced = 0;

  for (const player of Array.from(assignments.values())) {
    const { data: existing } = await supabase
      .from("players_master")
      .select("id")
      .eq("api_football_id", player.apiFootballId)
      .maybeSingle();

    const payload = {
      nombre: player.nombre,
      equipo_real: player.equipo,
      posicion: player.posicion,
      rareza: player.rareza,
      costo_base: player.costo_base,
      performance_score: player.performance_score,
      stats_updated_at: now,
      photo_url: player.photo,
      updated_at: now,
    };

    if (existing) {
      const { error } = await supabase
        .from("players_master")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("players_master").insert({
        api_football_id: player.apiFootballId,
        ...payload,
      });
      if (error) throw error;
    }
    synced += 1;
  }

  return synced;
}

async function runEvaluatePlayerTiers() {
  console.log(`Modo: ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`Liga ${leagueId}, temporada ${season}`);

  if (!isApiFootballConfigured()) {
    console.error("API_FOOTBALL_KEY no configurada.");
    process.exit(1);
  }

  const supabase =
    url && serviceKey
      ? createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  if (supabase) {
    await reportDb(supabase);
  } else {
    console.warn("Sin Supabase service role — solo reporte API.");
  }

  console.log("\nFetching jugadores de API-Football…");
  const rows = await fetchAllLeaguePlayers();
  console.log(`Filas API: ${rows.length}`);

  const assignments = buildTierAssignmentsFromApiRows(
    rows,
    leagueId,
    mapApiPosition
  );

  const counts: Partial<Record<Rarity, number>> = {};
  for (const row of Array.from(assignments.values())) {
    counts[row.rareza] = (counts[row.rareza] ?? 0) + 1;
  }
  printDistribution("Propuesta desde API", counts, assignments.size);
  summarizeCosts(assignments);

  if (apply) {
    if (!supabase) {
      console.error(
        "--apply requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
      );
      process.exit(1);
    }
    const synced = await applyAssignments(supabase, assignments);
    console.log(`\nUpsert completado: ${synced} jugadores`);
    await reportDb(supabase);
  } else {
    console.log("\nDry-run. Usa --apply para escribir en players_master.");
  }
}

runEvaluatePlayerTiers().catch((err) => {
  console.error(err);
  process.exit(1);
});
