/**
 * Recompute club_season_points for API_FOOTBALL_SEASON (default 2026)
 * by summing club_gameweek_points across that season's gameweeks.
 *
 * Usage: node scripts/refresh-season-totals.mjs
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }
}

loadEnv();

const season = Number(process.env.API_FOOTBALL_SEASON ?? 2026);
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: gameweeks } = await sb
  .from("gameweeks")
  .select("id")
  .eq("season", season);
const gwIds = (gameweeks ?? []).map((g) => g.id);
console.log("season", season, "gameweeks", gwIds.length);

const { data: points } = await sb
  .from("club_gameweek_points")
  .select("club_id, points")
  .in("gameweek_id", gwIds);

const totals = new Map();
for (const row of points ?? []) {
  totals.set(
    row.club_id,
    (totals.get(row.club_id) ?? 0) + Number(row.points || 0)
  );
}

let upserted = 0;
for (const [clubId, total] of totals) {
  const { error } = await sb.from("club_season_points").upsert(
    {
      club_id: clubId,
      season,
      total_points: total,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "club_id,season" }
  );
  if (error) console.error(clubId, error);
  else upserted += 1;
}

const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log("upserted", upserted);
console.log(
  "top",
  top.map(([club_id, total_points]) => ({ club_id, total_points }))
);
