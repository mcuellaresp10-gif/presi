/**
 * Refresh players_master.nombre from API-Football firstname+lastname.
 * Does not re-tier costs/rarities.
 *
 *   node scripts/refresh-player-names.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.API_FOOTBALL_KEY;
const leagueId = Number(process.env.API_FOOTBALL_LEAGUE_ID || 239);
const season = Number(process.env.API_FOOTBALL_SEASON || 2026);

if (!url || !key || !apiKey) {
  console.error("Missing env (Supabase or API_FOOTBALL_KEY)");
  process.exit(1);
}

function formatName(player) {
  const first = (player.firstname ?? "").trim();
  const last = (player.lastname ?? "").trim();
  if (first && last) return `${first} ${last}`;
  if (last) return last;
  if (first) return first;
  return (player.name ?? "").trim() || "Jugador";
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchPage(page) {
  const endpoint = new URL("https://v3.football.api-sports.io/players");
  endpoint.searchParams.set("league", String(leagueId));
  endpoint.searchParams.set("season", String(season));
  endpoint.searchParams.set("page", String(page));
  const res = await fetch(endpoint.toString(), {
    headers: { "x-apisports-key": apiKey },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

let page = 1;
let totalPages = 1;
let updated = 0;
let unchanged = 0;
let missing = 0;

console.log(`Refreshing names league=${leagueId} season=${season}`);

while (page <= totalPages) {
  const json = await fetchPage(page);
  totalPages = json.paging?.total ?? page;
  const rows = json.response ?? [];
  console.log(`  page ${page}/${totalPages} (${rows.length} players)`);

  for (const row of rows) {
    const apiId = row.player?.id;
    if (!apiId) continue;
    const nombre = formatName(row.player);
    const { data: existing } = await sb
      .from("players_master")
      .select("id, nombre")
      .eq("api_football_id", apiId)
      .maybeSingle();

    if (!existing) {
      missing += 1;
      continue;
    }
    if (existing.nombre === nombre) {
      unchanged += 1;
      continue;
    }
    await sb
      .from("players_master")
      .update({ nombre, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    updated += 1;
  }

  page += 1;
  // gentle pacing
  await new Promise((r) => setTimeout(r, 250));
}

const { data: pena } = await sb
  .from("players_master")
  .select("nombre")
  .eq("api_football_id", 13803)
  .maybeSingle();

console.log("\nDone", { updated, unchanged, missing });
console.log("Peña sample:", pena?.nombre);
