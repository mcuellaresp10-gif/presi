/**
 * Repair empty lineup snapshots from roster / previous GW / draft, then
 * trigger gameweek scoring via the cron route (or inline lock only).
 *
 *   node scripts/repair-npc-lineups.mjs
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
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function fromRoster(rows) {
  const starters = rows
    .filter((r) => r.squad_role === "starter" || (!r.squad_role && r.es_titular))
    .map((r) => r.player_id);
  const bench = rows
    .filter((r) => r.squad_role === "bench")
    .map((r) => r.player_id);
  return { starters, bench };
}

async function repairGameweek(gw) {
  const { data: clubs } = await sb.from("clubs").select("id, estilo");
  let repaired = 0;

  for (const club of clubs ?? []) {
    const { data: existing } = await sb
      .from("lineup_snapshots")
      .select("starter_ids")
      .eq("club_id", club.id)
      .eq("gameweek_id", gw.id)
      .maybeSingle();

    const starters = existing?.starter_ids ?? [];
    if (existing && starters.length > 0) continue;

    const [{ data: draft }, { data: roster }, { data: prev }] =
      await Promise.all([
        sb
          .from("lineup_drafts")
          .select("starter_ids,bench_ids,captain_id,formation")
          .eq("club_id", club.id)
          .eq("gameweek_id", gw.id)
          .maybeSingle(),
        sb
          .from("club_roster")
          .select("player_id,squad_role,es_titular")
          .eq("club_id", club.id),
        sb
          .from("lineup_snapshots")
          .select("starter_ids,bench_ids,captain_id,formation")
          .eq("club_id", club.id)
          .neq("gameweek_id", gw.id)
          .order("locked_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    let starterIds = draft?.starter_ids ?? [];
    let benchIds = draft?.bench_ids ?? [];
    let captainId = draft?.captain_id ?? null;
    let formation = draft?.formation ?? null;

    if (!starterIds.length && prev?.starter_ids?.length) {
      starterIds = prev.starter_ids;
      benchIds = prev.bench_ids ?? [];
      captainId = prev.captain_id ?? null;
      formation = prev.formation ?? null;
    }

    if (!starterIds.length) {
      const r = fromRoster(roster ?? []);
      starterIds = r.starters;
      benchIds = r.bench;
      captainId = starterIds[0] ?? null;
    }

    if (!starterIds.length) continue;

    const nowIso = new Date().toISOString();
    const payload = {
      club_id: club.id,
      gameweek_id: gw.id,
      starter_ids: starterIds,
      bench_ids: benchIds,
      captain_id: captainId ?? starterIds[0] ?? null,
      formation,
      is_valid: starterIds.length === 11 && benchIds.length === 5,
      locked_at: nowIso,
    };

    if (existing) {
      await sb
        .from("lineup_snapshots")
        .update(payload)
        .eq("club_id", club.id)
        .eq("gameweek_id", gw.id);
    } else {
      await sb.from("lineup_snapshots").insert(payload);
    }

    await sb.from("lineup_drafts").upsert(
      {
        club_id: club.id,
        gameweek_id: gw.id,
        starter_ids: starterIds,
        bench_ids: benchIds,
        captain_id: captainId ?? starterIds[0] ?? null,
        formation,
        updated_at: nowIso,
      },
      { onConflict: "club_id,gameweek_id" }
    );

    repaired += 1;
  }

  return repaired;
}

const { data: live } = await sb
  .from("gameweeks")
  .select("id, round, status")
  .eq("status", "live");

if (!live?.length) {
  console.log("No live gameweeks");
  process.exit(0);
}

for (const gw of live) {
  console.log(`\nRepair J${gw.round}…`);
  const n = await repairGameweek(gw);
  console.log(`  repaired ${n} clubs`);

  const { data: npcs } = await sb
    .from("clubs")
    .select("id")
    .eq("estilo", "__npc__");
  const ids = (npcs ?? []).map((c) => c.id);
  const { data: snaps } = await sb
    .from("lineup_snapshots")
    .select("starter_ids")
    .eq("gameweek_id", gw.id)
    .in("club_id", ids);
  const withXi = (snaps ?? []).filter((s) => (s.starter_ids || []).length > 0)
    .length;
  console.log(`  NPC with XI: ${withXi}/${ids.length}`);
}

const secret = process.env.CRON_SECRET;
const ports = [3001, 3000];
let scored = false;
for (const port of ports) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (secret) headers.Authorization = `Bearer ${secret}`;
    const res = await fetch(
      `http://127.0.0.1:${port}/api/cron/gameweek?skipCalendar=1`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          gameweekIds: live.map((g) => g.id),
        }),
      }
    );
    const text = await res.text();
    console.log(`\nCron :${port} → ${res.status}`, text.slice(0, 500));
    if (res.ok) {
      scored = true;
      break;
    }
  } catch (e) {
    console.log(`Cron :${port} failed:`, e.message);
  }
}

if (!scored) {
  console.log(
    "\nSnapshots repaired. Run scoring via cron when the server is up."
  );
}

// Final points check
for (const gw of live) {
  const { data: npcs } = await sb
    .from("clubs")
    .select("id")
    .eq("estilo", "__npc__");
  const ids = (npcs ?? []).map((c) => c.id);
  const { data: pts } = await sb
    .from("club_gameweek_points")
    .select("points")
    .eq("gameweek_id", gw.id)
    .in("club_id", ids);
  const scoring = (pts ?? []).filter((p) => Number(p.points) > 0).length;
  const sum = (pts ?? []).reduce((a, p) => a + (Number(p.points) || 0), 0);
  console.log(
    `J${gw.round} NPC points>0: ${scoring}/${ids.length}, sum=${sum}`
  );
}
