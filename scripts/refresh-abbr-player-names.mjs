/**
 * Second pass: fix remaining abbreviated nombres (e.g. "J. Muñoz")
 * by looking up each player id across seasons 2026 → 2025 → 2024.
 *
 *   node scripts/refresh-abbr-player-names.mjs
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
if (!url || !key || !apiKey) {
  console.error("Missing env");
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

function isAbbreviated(nombre) {
  return /^[A-ZÁÉÍÓÚÑÜ]\.\s+\S/.test((nombre ?? "").trim());
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: rows, error } = await sb
  .from("players_master")
  .select("id, nombre, api_football_id")
  .not("api_football_id", "is", null);

if (error) throw error;

const targets = (rows ?? []).filter((r) => isAbbreviated(r.nombre));
console.log(`Abbreviated left: ${targets.length}`);

let updated = 0;
let stillShort = 0;
let notFound = 0;

async function fetchPlayer(apiId) {
  for (const season of [2026, 2025, 2024, 2023]) {
    const endpoint = new URL("https://v3.football.api-sports.io/players");
    endpoint.searchParams.set("id", String(apiId));
    endpoint.searchParams.set("season", String(season));
    const res = await fetch(endpoint.toString(), {
      headers: { "x-apisports-key": apiKey },
    });
    if (!res.ok) continue;
    const json = await res.json();
    const player = json.response?.[0]?.player;
    if (player) return { player, season };
    await new Promise((r) => setTimeout(r, 120));
  }
  return null;
}

for (let i = 0; i < targets.length; i++) {
  const row = targets[i];
  const hit = await fetchPlayer(row.api_football_id);
  if (!hit) {
    notFound += 1;
    console.log(`  miss ${row.nombre} (api ${row.api_football_id})`);
    continue;
  }
  const nombre = formatName(hit.player);
  if (isAbbreviated(nombre) || nombre === row.nombre) {
    stillShort += 1;
    console.log(
      `  keep ${row.nombre} → api still short (${hit.season}): ${nombre}`
    );
    continue;
  }
  await sb
    .from("players_master")
    .update({ nombre, updated_at: new Date().toISOString() })
    .eq("id", row.id);
  updated += 1;
  console.log(`  ok ${row.nombre} → ${nombre}`);
  await new Promise((r) => setTimeout(r, 150));
}

console.log("\nDone", { updated, stillShort, notFound });
