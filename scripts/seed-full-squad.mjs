/**
 * Arma plantilla completa (24 jugadores + alineación 11+5) para un usuario por email.
 *
 * Uso:
 *   node scripts/seed-full-squad.mjs m.cuellaresp10@gmail.com
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/seed-full-squad.mjs <email>");
  process.exit(1);
}

const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));

if (!envPath) {
  console.error("No se encontró .env.local");
  process.exit(1);
}

for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const key = t.slice(0, i).trim();
  const val = t.slice(i + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.API_FOOTBALL_KEY?.trim();
const leagueId = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? 239);
const season = Number(process.env.API_FOOTBALL_SEASON ?? new Date().getFullYear());

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SQUAD_TARGETS = { GK: 2, DEF: 8, MED: 8, DEL: 6 };
const STARTER_SLOTS = { GK: 1, DEF: 4, MED: 4, DEL: 2 };
const BENCH_SLOTS = { GK: 1, DEF: 2, MED: 1, DEL: 1 };
const JORNADAS = { bronce: 5, plata: 4, oro: 3, leyenda: 2 };

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mapApiPosition(pos) {
  const p = (pos ?? "").toUpperCase();
  if (p === "G" || p.includes("GOAL")) return "GK";
  if (p === "D" || p.includes("DEF")) return "DEF";
  if (p === "M" || p.includes("MID")) return "MED";
  return "DEL";
}

async function syncPlayersFromApi() {
  if (!apiKey) {
    console.log("Sin API_FOOTBALL_KEY — usando jugadores ya en players_master");
    return 0;
  }

  let synced = 0;
  for (let page = 1; page <= 5; page++) {
    const apiUrl = new URL("https://v3.football.api-sports.io/players");
    apiUrl.searchParams.set("league", String(leagueId));
    apiUrl.searchParams.set("season", String(season));
    apiUrl.searchParams.set("page", String(page));

    const res = await fetch(apiUrl, {
      headers: { "x-apisports-key": apiKey },
    });
    if (!res.ok) throw new Error(`API-Football ${res.status}`);
    const json = await res.json();
    const batch = json.response ?? [];
    if (!batch.length) break;

    for (const row of batch) {
      const apiId = row.player.id;
      const posicion = mapApiPosition(row.statistics?.[0]?.games?.position ?? null);
      const equipo = row.statistics?.[0]?.team?.name ?? "Liga BetPlay";

      const { data: existing } = await supabase
        .from("players_master")
        .select("id")
        .eq("api_football_id", apiId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("players_master")
          .update({
            nombre: row.player.name,
            equipo_real: equipo,
            posicion,
            photo_url: row.player.photo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("players_master").insert({
          api_football_id: apiId,
          nombre: row.player.name,
          equipo_real: equipo,
          posicion,
          rareza: "bronce",
          costo_base: 3_000_000,
          photo_url: row.player.photo,
        });
      }
      synced += 1;
    }
  }
  console.log(`Sync API-Football: ${synced} jugadores procesados`);
  return synced;
}

function pickByPosition(pool, slots) {
  const picked = [];
  const byPos = { GK: [], DEF: [], MED: [], DEL: [] };
  for (const p of pool) byPos[p.posicion].push(p);

  for (const [pos, count] of Object.entries(slots)) {
    const available = shuffle(byPos[pos]);
    if (available.length < count) {
      throw new Error(
        `No hay suficientes ${pos}: necesitas ${count}, hay ${available.length}`
      );
    }
    picked.push(...available.slice(0, count));
  }
  return picked;
}

function contractFields(rareza, isStarter) {
  const base = JORNADAS[rareza] ?? 3;
  const jornadas = isStarter ? base * 2 : base;
  return { jornadas_restantes: jornadas, renovaciones: 0 };
}

async function findUserByEmail(targetEmail) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const user = data.users.find(
      (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
    );
    if (user) return user;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function syncFixturesFromApi() {
  if (!apiKey) return;

  const apiUrl = new URL("https://v3.football.api-sports.io/fixtures");
  apiUrl.searchParams.set("league", String(leagueId));
  apiUrl.searchParams.set("season", String(season));

  const res = await fetch(apiUrl, { headers: { "x-apisports-key": apiKey } });
  if (!res.ok) throw new Error(`Fixtures API ${res.status}`);
  const fixtures = (await res.json()).response ?? [];

  const byRound = new Map();
  for (const f of fixtures) {
    const match = f.league.round.match(/(\d+)/);
    const round = match ? Number(match[1]) : 1;
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round).push(f);
  }

  for (const [round, roundFixtures] of byRound.entries()) {
    const kickoffs = roundFixtures.map((f) => new Date(f.fixture.date).getTime());
    const { data: gw } = await supabase
      .from("gameweeks")
      .upsert(
        {
          season,
          round,
          first_kickoff_at: new Date(Math.min(...kickoffs)).toISOString(),
          last_kickoff_at: new Date(Math.max(...kickoffs)).toISOString(),
          status: "upcoming",
        },
        { onConflict: "season,round" }
      )
      .select()
      .single();

    if (!gw) continue;

    for (const f of roundFixtures) {
      await supabase.from("fixtures").upsert(
        {
          gameweek_id: gw.id,
          api_football_fixture_id: f.fixture.id,
          kickoff_at: f.fixture.date,
          home_team: f.teams.home.name,
          away_team: f.teams.away.name,
          status: f.fixture.status.short,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "api_football_fixture_id" }
      );
    }
  }
  console.log(`Fixtures sync: ${byRound.size} jornadas`);
}

async function getCurrentGameweekId() {
  const now = new Date().toISOString();

  const { data: live } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("status", "live")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (live) return live.id;

  const { data: upcoming } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("status", "upcoming")
    .gte("first_kickoff_at", now)
    .order("first_kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (upcoming) return upcoming.id;

  const { data: anyGw } = await supabase
    .from("gameweeks")
    .select("id")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();
  return anyGw?.id ?? null;
}

async function main() {
  console.log(`\n🎯 Plantilla completa para ${email}\n`);

  const user = await findUserByEmail(email);
  if (!user) {
    console.error(`No existe usuario con email ${email}`);
    process.exit(1);
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, nombre")
    .eq("user_id", user.id)
    .maybeSingle();

  if (clubError) throw clubError;
  if (!club) {
    console.error("El usuario no tiene club. Completa onboarding primero.");
    process.exit(1);
  }

  console.log(`Club: ${club.nombre} (${club.id})`);

  await syncPlayersFromApi();
  await syncFixturesFromApi();

  let { data: allPlayers } = await supabase
    .from("players_master")
    .select("*")
    .not("api_football_id", "is", null);

  if (!allPlayers?.length) {
    console.log("Sin jugadores API — usando pool seed/mock");
    const { data: mockPlayers } = await supabase.from("players_master").select("*");
    allPlayers = mockPlayers ?? [];
  }

  const byPos = { GK: [], DEF: [], MED: [], DEL: [] };
  for (const p of allPlayers) {
    if (byPos[p.posicion]) byPos[p.posicion].push(p);
  }

  const squad = [];
  for (const [pos, count] of Object.entries(SQUAD_TARGETS)) {
    const picked = shuffle(byPos[pos]).slice(0, count);
    if (picked.length < count) {
      console.error(
        `Pool insuficiente en ${pos}: ${picked.length}/${count}. Ejecuta seed.sql o revisa API key.`
      );
      process.exit(1);
    }
    squad.push(...picked);
  }

  const starters = pickByPosition(squad, STARTER_SLOTS);
  const starterIds = new Set(starters.map((p) => p.id));
  const remaining = squad.filter((p) => !starterIds.has(p.id));
  const bench = pickByPosition(remaining, BENCH_SLOTS);
  const benchIds = new Set(bench.map((p) => p.id));
  const reserve = remaining.filter((p) => !benchIds.has(p.id));

  console.log(`\nPlantilla: ${squad.length} jugadores (11+5+${reserve.length})`);
  console.log(`Formación: 4-4-2`);

  await supabase.from("lineup_drafts").delete().eq("club_id", club.id);
  await supabase.from("lineup_snapshots").delete().eq("club_id", club.id);
  await supabase.from("club_roster").delete().eq("club_id", club.id);

  const rosterRows = squad.map((p) => {
    const isStarter = starterIds.has(p.id);
    const isBench = benchIds.has(p.id);
    const squadRole = isStarter ? "starter" : isBench ? "bench" : "reserve";
    return {
      club_id: club.id,
      player_id: p.id,
      es_titular: isStarter,
      squad_role: squadRole,
      fecha_fichaje: new Date().toISOString(),
    };
  });

  const { error: rosterError } = await supabase.from("club_roster").insert(rosterRows);
  if (rosterError) throw rosterError;

  const gameweekId = await getCurrentGameweekId();
  if (gameweekId) {
    const { error: draftError } = await supabase.from("lineup_drafts").upsert(
      {
        club_id: club.id,
        gameweek_id: gameweekId,
        starter_ids: starters.map((p) => p.id),
        bench_ids: bench.map((p) => p.id),
        captain_id: starters[0]?.id ?? null,
        formation: "4-4-2",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "club_id,gameweek_id" }
    );
    if (draftError) throw draftError;
    console.log(`Lineup draft guardado para jornada ${gameweekId}`);
  } else {
    console.log("Sin jornada activa — roster OK, draft pendiente de sync");
  }

  console.log("\n✅ Titulares:");
  for (const p of starters) {
    console.log(`  ${p.posicion}  ${p.nombre} (${p.equipo_real})`);
  }
  console.log("\n✅ Banca:");
  for (const p of bench) {
    console.log(`  ${p.posicion}  ${p.nombre} (${p.equipo_real})`);
  }
  console.log("\n✅ Reserva:");
  for (const p of reserve) {
    console.log(`  ${p.posicion}  ${p.nombre} (${p.equipo_real})`);
  }
  console.log("\nListo — recarga /plantilla en el navegador.\n");
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
