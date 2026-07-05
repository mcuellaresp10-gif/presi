/**
 * Reporte de distribución de rareza/costos y sync opcional desde API-Football.
 *
 * Uso:
 *   node scripts/evaluate-player-tiers.mjs           # dry-run (solo reporte)
 *   node scripts/evaluate-player-tiers.mjs --apply   # upsert en players_master
 */

import { spawnSync } from "child_process";
import { resolve } from "path";

const args = process.argv.slice(2);
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const result = spawnSync(
  npx,
  [
    "vite-node",
    "--config",
    resolve("vitest.cli.config.ts"),
    resolve("scripts/evaluate-player-tiers.cli.ts"),
    ...args,
  ],
  { stdio: "inherit", shell: true, cwd: process.cwd() }
);

process.exit(result.status ?? 1);
