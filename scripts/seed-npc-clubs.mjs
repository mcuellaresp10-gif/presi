/**
 * Crea 50 clubes NPC (Auth shell @presi.npc) para ranking + rivales.
 * Empiezan con 0 puntos de temporada; compiten jornada a jornada.
 *
 * Uso:
 *   node scripts/seed-npc-clubs.mjs
 *   node scripts/seed-npc-clubs.mjs --force   # borra NPC previos y recrea
 */

import { createHash, randomBytes } from "crypto";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const FORCE = process.argv.includes("--force");
const TARGET_COUNT = 50;
const TIERS = { elite: 7, medio: 22, flojo: 21 };
const NPC_DOMAIN = "presi.npc";
const NPC_ESTILO = "__npc__";
const NPC_JORNADAS = 9999;

const SQUAD_TARGETS = { GK: 2, DEF: 7, MED: 7, DEL: 4 }; // 20
const FORMATIONS = [
  { label: "4-4-2", slots: { GK: 1, DEF: 4, MED: 4, DEL: 2 } },
  { label: "4-3-3", slots: { GK: 1, DEF: 4, MED: 3, DEL: 3 } },
  { label: "3-5-2", slots: { GK: 1, DEF: 3, MED: 5, DEL: 2 } },
  { label: "5-3-2", slots: { GK: 1, DEF: 5, MED: 3, DEL: 2 } },
  { label: "3-4-3", slots: { GK: 1, DEF: 3, MED: 4, DEL: 3 } },
];
const BENCH_SLOTS = { GK: 1, DEF: 2, MED: 1, DEL: 1 };
const FACILITY_TYPES = [
  "hinchas",
  "scouting",
  "oficina",
  "academia",
  "cuerpo_medico",
  "gimnasio",
];

const PREFIXES = [
  "Atlético",
  "Deportivo",
  "Real",
  "Independiente",
  "Club",
  "Unión",
  "Sporting",
  "Junior",
  "América",
  "Ciclón",
];
const ROOTS = [
  "Andes",
  "Cauca",
  "Café",
  "Cóndor",
  "Llanos",
  "Magdalena",
  "Caimán",
  "Oro",
  "Palma",
  "Nevado",
  "Quindío",
  "Sabana",
  "Tolima",
  "Cali",
  "Boyacá",
  "Huila",
  "Chocó",
  "Caribe",
  "Pacífico",
  "Guajira",
  "Meta",
  "Risaralda",
  "Cúcuta",
  "Cartagena",
  "Santander",
];
const SUFFIXES = ["FC", "SC", "CF", ""];
const PALETTES = [
  { primaryColor: "#070B18", secondaryColor: "#F5C518", accentColor: "#22D3EE" },
  { primaryColor: "#0B5E2E", secondaryColor: "#FFFFFF", accentColor: "#C9A227" },
  { primaryColor: "#B91C1C", secondaryColor: "#1E3A8A", accentColor: "#F5C518" },
  { primaryColor: "#EAB308", secondaryColor: "#DC2626", accentColor: "#1F2937" },
  { primaryColor: "#1E3A8A", secondaryColor: "#FFFFFF", accentColor: "#EF4444" },
  { primaryColor: "#14532D", secondaryColor: "#FDE047", accentColor: "#FFFFFF" },
  { primaryColor: "#0F172A", secondaryColor: "#F97316", accentColor: "#38BDF8" },
  { primaryColor: "#7C2D12", secondaryColor: "#FECACA", accentColor: "#FBBF24" },
];
const PATTERNS = ["solid", "vertical", "horizontal", "diagonal"];

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
  const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rarityRank(r) {
  return { leyenda: 4, oro: 3, plata: 2, bronce: 1 }[r] ?? 1;
}

function randomClubName(used) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const prefix = pick(PREFIXES);
    const root = pick(ROOTS);
    const suffix = pick(SUFFIXES);
    const name = `${prefix} ${root}${suffix ? ` ${suffix}` : ""}`.trim();
    if (name.toLowerCase().includes("bot")) continue;
    if (name.length < 3 || name.length > 30) continue;
    if (used.has(name.toLowerCase())) continue;
    used.add(name.toLowerCase());
    return name;
  }
  const fallback = `Real ${pick(ROOTS)} ${randInt(1, 99)}`;
  used.add(fallback.toLowerCase());
  return fallback;
}

function slugFromName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 36);
}

function randomEscudo() {
  const palette = pick(PALETTES);
  return {
    shapeId: randInt(1, 6),
    iconId: randInt(1, 12),
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
    pattern: pick(PATTERNS),
  };
}

function tierPlan() {
  const plan = [];
  for (let i = 0; i < TIERS.elite; i++) plan.push("elite");
  for (let i = 0; i < TIERS.medio; i++) plan.push("medio");
  for (let i = 0; i < TIERS.flojo; i++) plan.push("flojo");
  return shuffle(plan);
}

function tierBudget(tier) {
  if (tier === "elite") return randInt(18_000_000, 28_000_000);
  if (tier === "medio") return randInt(8_000_000, 16_000_000);
  return randInt(2_000_000, 7_000_000);
}

function tierGemas(tier) {
  if (tier === "elite") return randInt(100, 180);
  if (tier === "medio") return randInt(60, 120);
  return randInt(30, 80);
}

/** Weighted pool order by rarity preference */
function sortPoolForTier(players, tier) {
  const scored = players.map((p) => {
    const r = rarityRank(p.rareza);
    let score = r;
    if (tier === "elite") score = r * 10 + Math.random();
    else if (tier === "medio") score = (r === 2 || r === 3 ? 8 : r) + Math.random();
    else score = (5 - r) * 3 + Math.random(); // prefer bronce
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.p);
}

function pickSquad(pool, tier) {
  const byPos = { GK: [], DEF: [], MED: [], DEL: [] };
  for (const p of pool) {
    if (byPos[p.posicion]) byPos[p.posicion].push(p);
  }
  for (const pos of Object.keys(byPos)) {
    byPos[pos] = sortPoolForTier(byPos[pos], tier);
  }

  const squad = [];
  for (const [pos, count] of Object.entries(SQUAD_TARGETS)) {
    const available = byPos[pos];
    if (available.length < count) {
      throw new Error(
        `Pool insuficiente ${pos}: ${available.length}/${count}`
      );
    }
    // Take from top of weighted list with some randomness in window
    const window = available.slice(0, Math.min(available.length, count * 4));
    squad.push(...shuffle(window).slice(0, count));
  }
  return squad;
}

function pickByPosition(pool, slots) {
  const byPos = { GK: [], DEF: [], MED: [], DEL: [] };
  for (const p of pool) byPos[p.posicion].push(p);
  const picked = [];
  for (const [pos, count] of Object.entries(slots)) {
    const available = shuffle(byPos[pos]);
    if (available.length < count) {
      throw new Error(`No hay suficientes ${pos} para XI: ${available.length}/${count}`);
    }
    picked.push(...available.slice(0, count));
  }
  return picked;
}

function pickLineup(squad, tier) {
  const formation = pick(FORMATIONS);
  // Prefer higher rarity for elite starters
  const ordered = sortPoolForTier(squad, tier);
  const starters = [];
  const used = new Set();
  const need = { ...formation.slots };

  for (const p of ordered) {
    const pos = p.posicion;
    if ((need[pos] ?? 0) <= 0) continue;
    starters.push(p);
    used.add(p.id);
    need[pos] -= 1;
  }
  // Fill gaps randomly if any
  for (const [pos, count] of Object.entries(need)) {
    if (count <= 0) continue;
    const candidates = shuffle(
      squad.filter((p) => p.posicion === pos && !used.has(p.id))
    );
    for (let i = 0; i < count; i++) {
      const p = candidates[i];
      if (!p) throw new Error(`No se pudo completar XI ${pos}`);
      starters.push(p);
      used.add(p.id);
    }
  }

  const remaining = squad.filter((p) => !used.has(p.id));
  const bench = pickByPosition(remaining, BENCH_SLOTS);
  return { formation: formation.label, starters, bench };
}

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  while (page <= 30) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if ((data.users ?? []).length < 200) break;
    page += 1;
  }
  return users;
}

async function deleteExistingNpcs() {
  const users = await listAllAuthUsers();
  const npcUsers = users.filter(
    (u) =>
      (u.email ?? "").toLowerCase().endsWith(`@${NPC_DOMAIN}`) ||
      u.app_metadata?.npc === true
  );
  console.log(`NPC Auth encontrados: ${npcUsers.length}`);

  for (const user of npcUsers) {
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (club) {
      const cid = club.id;
      await supabase.from("club_wild_cards").delete().eq("club_id", cid);
      await supabase.from("loan_market_state").delete().eq("club_id", cid);
      await supabase.from("lineup_drafts").delete().eq("club_id", cid);
      await supabase.from("lineup_snapshots").delete().eq("club_id", cid);
      await supabase.from("club_gameweek_points").delete().eq("club_id", cid);
      await supabase.from("club_season_points").delete().eq("club_id", cid);
      await supabase.from("contract_gameweek_log").delete().eq("club_id", cid);
      await supabase.from("club_roster").delete().eq("club_id", cid);
      await supabase.from("facilities").delete().eq("club_id", cid);
      await supabase.from("scouting_packs").delete().eq("club_id", cid);
      await supabase.from("academy_packs").delete().eq("club_id", cid);
      await supabase.from("league_memberships").delete().eq("club_id", cid);
      await supabase.from("clubs").delete().eq("id", cid);
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) console.warn(`No se pudo borrar user ${user.email}:`, error.message);
  }
}

async function getEditingGameweek() {
  const now = new Date().toISOString();
  const { data: live } = await supabase
    .from("gameweeks")
    .select("id, status, round")
    .eq("status", "live")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (live) return live;

  const { data: upcoming } = await supabase
    .from("gameweeks")
    .select("id, status, round")
    .eq("status", "upcoming")
    .gte("first_kickoff_at", now)
    .order("first_kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (upcoming) return upcoming;

  const { data: anyGw } = await supabase
    .from("gameweeks")
    .select("id, status, round")
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();
  return anyGw;
}

async function createNpcClub({ name, tier, pool, usedPlayerIds, gameweek, season }) {
  const slug = `${slugFromName(name)}.${randomBytes(3).toString("hex")}`;
  const email = `npc.${slug}@${NPC_DOMAIN}`;
  const password = randomBytes(24).toString("base64url");

  const { data: created, error: createErr } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { npc: true, tier },
      user_metadata: { npc: true, display_name: name },
    });
  if (createErr || !created.user) {
    throw new Error(`Auth create ${email}: ${createErr?.message ?? "fail"}`);
  }

  const userId = created.user.id;
  const escudo = randomEscudo();

  const { data: club, error: clubErr } = await supabase
    .from("clubs")
    .insert({
      user_id: userId,
      nombre: name,
      escudo_config: escudo,
      ciudad_ficticia: pick(ROOTS),
      apodo: name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z]/g, "")
        .slice(0, 4)
        .toUpperCase() || "CLUB",
      estilo: NPC_ESTILO,
      presupuesto: tierBudget(tier),
      gemas: tierGemas(tier),
      onboarding_completado: true,
      sobres_restantes: 0,
    })
    .select("id, nombre")
    .single();

  if (clubErr || !club) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(`Club insert: ${clubErr?.message ?? "fail"}`);
  }

  const available = pool.filter((p) => !usedPlayerIds.has(p.id));
  const squad = pickSquad(available.length >= 20 ? available : pool, tier);
  for (const p of squad) usedPlayerIds.add(p.id);

  const { formation, starters, bench } = pickLineup(squad, tier);
  const starterIds = new Set(starters.map((p) => p.id));
  const benchIds = new Set(bench.map((p) => p.id));

  const rosterRows = squad.map((p) => {
    const isStarter = starterIds.has(p.id);
    const isBench = benchIds.has(p.id);
    return {
      club_id: club.id,
      player_id: p.id,
      es_titular: isStarter,
      squad_role: isStarter ? "starter" : isBench ? "bench" : "reserve",
      jornadas_restantes: NPC_JORNADAS,
      renovaciones: 0,
      es_prestamo: false,
      prestamo_jornadas_restantes: null,
      fecha_fichaje: new Date().toISOString(),
    };
  });

  const { error: rosterErr } = await supabase.from("club_roster").insert(rosterRows);
  if (rosterErr) throw new Error(`Roster: ${rosterErr.message}`);

  const { error: facErr } = await supabase.from("facilities").insert(
    FACILITY_TYPES.map((tipo) => ({ club_id: club.id, tipo, nivel: 1 }))
  );
  if (facErr) throw new Error(`Facilities: ${facErr.message}`);

  const nowIso = new Date().toISOString();
  const later = new Date(Date.now() + 48 * 3600_000).toISOString();
  await supabase.from("scouting_packs").insert({
    club_id: club.id,
    genera_en: later,
    estado: "timer",
  });
  await supabase.from("academy_packs").insert({
    club_id: club.id,
    genera_en: later,
    estado: "timer",
  });
  await supabase.from("loan_market_state").insert({
    club_id: club.id,
    refresh_en: later,
    offers: [],
  });

  if (gameweek) {
    const starterIdList = starters.map((p) => p.id);
    const benchIdList = bench.map((p) => p.id);
    const captainId = starters[0]?.id ?? null;

    const { error: draftErr } = await supabase.from("lineup_drafts").upsert(
      {
        club_id: club.id,
        gameweek_id: gameweek.id,
        starter_ids: starterIdList,
        bench_ids: benchIdList,
        captain_id: captainId,
        formation,
        updated_at: nowIso,
      },
      { onConflict: "club_id,gameweek_id" }
    );
    if (draftErr) throw new Error(`Draft: ${draftErr.message}`);

    // Snapshot if live / scoring — locked valid XI
    if (gameweek.status === "live" || gameweek.status === "finished") {
      const snapPayload = {
        club_id: club.id,
        gameweek_id: gameweek.id,
        starter_ids: starterIdList,
        bench_ids: benchIdList,
        formation,
        is_valid: true,
        locked_at: nowIso,
        captain_id: captainId,
      };
      const { error: snapErr } = await supabase
        .from("lineup_snapshots")
        .upsert(snapPayload, { onConflict: "club_id,gameweek_id" });
      if (snapErr) {
        // Retry without captain if column missing older DBs
        delete snapPayload.captain_id;
        const { error: snapErr2 } = await supabase
          .from("lineup_snapshots")
          .upsert(snapPayload, { onConflict: "club_id,gameweek_id" });
        if (snapErr2) throw new Error(`Snapshot: ${snapErr2.message}`);
      }
    }
  }

  const { error: ptsErr } = await supabase.from("club_season_points").upsert(
    {
      club_id: club.id,
      season,
      total_points: 0,
      updated_at: nowIso,
    },
    { onConflict: "club_id,season" }
  );
  if (ptsErr) throw new Error(`Season points: ${ptsErr.message}`);

  return { club, email, tier, formation, squadSize: squad.length };
}

async function main() {
  console.log("\n🏟️  Seed 50 clubes NPC\n");
  if (FORCE) {
    console.log("--force: eliminando NPC previos…");
    await deleteExistingNpcs();
  } else {
    const users = await listAllAuthUsers();
    const existing = users.filter((u) =>
      (u.email ?? "").toLowerCase().endsWith(`@${NPC_DOMAIN}`)
    );
    if (existing.length >= TARGET_COUNT) {
      console.log(
        `Ya hay ${existing.length} NPC (@${NPC_DOMAIN}). Usa --force para recrear.`
      );
      return;
    }
    if (existing.length > 0) {
      console.log(
        `Hay ${existing.length} NPC parciales; se recrean todos (--force implícito).`
      );
      await deleteExistingNpcs();
    }
  }

  const { data: allPlayers, error: poolErr } = await supabase
    .from("players_master")
    .select("*")
    .not("api_football_id", "is", null);
  if (poolErr) throw poolErr;
  if (!allPlayers?.length || allPlayers.length < 80) {
    console.error(
      `Pool insuficiente (${allPlayers?.length ?? 0}). Sincroniza players_master primero.`
    );
    process.exit(1);
  }
  console.log(`Pool jugadores: ${allPlayers.length}`);

  const { data: nameRows } = await supabase.from("clubs").select("nombre");
  const usedNames = new Set(
    (nameRows ?? []).map((r) => String(r.nombre).toLowerCase())
  );

  const gameweek = await getEditingGameweek();
  console.log(
    gameweek
      ? `Jornada: round ${gameweek.round} (${gameweek.status})`
      : "Sin gameweek — roster listo; puntos = 0 hasta que arranque la liga"
  );
  const season = new Date().getFullYear();

  const plan = tierPlan();
  const usedPlayerIds = new Set();
  // Allow reuse across clubs after first pass of unique picks gets thin
  const results = [];

  for (let i = 0; i < plan.length; i++) {
    const tier = plan[i];
    const name = randomClubName(usedNames);
    // Soft uniqueness: if pool exhausted of unique, clear usedPlayerIds mid-way
    if (i > 0 && i % 15 === 0) usedPlayerIds.clear();

    try {
      const result = await createNpcClub({
        name,
        tier,
        pool: allPlayers,
        usedPlayerIds,
        gameweek,
        season,
      });
      results.push(result);
      console.log(
        `  [${i + 1}/${TARGET_COUNT}] ${tier.padEnd(5)} ${result.club.nombre} · ${result.formation} · ${result.squadSize} jug.`
      );
    } catch (err) {
      console.error(`  FAIL ${name} (${tier}):`, err.message ?? err);
      // Avoid duplicate name on retry of same name
    }
  }

  const byTier = { elite: 0, medio: 0, flojo: 0 };
  for (const r of results) byTier[r.tier] += 1;

  console.log("\n✅ Listo");
  console.log(`  Creados: ${results.length}/${TARGET_COUNT}`);
  console.log(`  Elite ${byTier.elite} · Medio ${byTier.medio} · Flojo ${byTier.flojo}`);
  console.log(`  Sample: ${results.slice(0, 5).map((r) => r.club.nombre).join(" · ")}`);
  console.log("\nRecarga ranking / inicio para verlos.\n");
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
