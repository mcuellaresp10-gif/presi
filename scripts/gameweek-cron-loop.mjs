/**
 * Llama POST /api/cron/gameweek cada 30s.
 * El servidor solo procesa stats si hay jornada `live`; si no, responde skipped al instante.
 *
 * Uso:
 *   BASE_URL=http://localhost:3000 node scripts/gameweek-cron-loop.mjs
 *   (CRON_SECRET opcional si lo configuraste en .env.local)
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const INTERVAL_MS = Number(process.env.CRON_INTERVAL_MS ?? 30_000);

async function tick() {
  const headers = CRON_SECRET
    ? { Authorization: `Bearer ${CRON_SECRET}` }
    : {};

  try {
    const res = await fetch(`${BASE_URL}/api/cron/gameweek`, {
      method: "POST",
      headers,
    });
    const body = await res.json();
    const time = new Date().toLocaleTimeString("es-CO");
    if (body.skipped) {
      console.log(`[${time}] sin jornada live — no sync (${body.reason})`);
    } else {
      console.log(`[${time}] sync OK`, body);
    }
  } catch (err) {
    console.error("cron error:", err.message ?? err);
  }
}

console.log(`Cron loop cada ${INTERVAL_MS / 1000}s → ${BASE_URL}/api/cron/gameweek`);
console.log("Ctrl+C para detener\n");

await tick();
setInterval(tick, INTERVAL_MS);
