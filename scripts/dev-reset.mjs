/**
 * Reinicio limpio del dev server.
 * Mata solo lo que ocupa 3000/3001, borra .next y arranca next dev.
 *
 * Uso: npm run dev:reset
 */

import { rmSync, existsSync } from "fs";
import { execSync, spawn } from "child_process";
import { resolve } from "path";

const root = process.cwd();
const nextDir = resolve(root, ".next");

function killDevPorts() {
  try {
    if (process.platform === "win32") {
      execSync(
        'powershell -NoProfile -Command "$ports = 3000,3001; foreach ($port in $ports) { Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"',
        { stdio: "ignore" }
      );
    } else {
      execSync("lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true", {
        stdio: "ignore",
        shell: true,
      });
    }
  } catch {
    // puertos libres
  }
}

console.log("🔄 Reinicio limpio de PRESI dev...\n");

killDevPorts();

if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("✅ Cache .next eliminada");
}

console.log("🚀 Iniciando next dev en http://localhost:3000\n");
console.log("   Si el navegador sigue sin estilos: Ctrl+Shift+R\n");

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const child = spawn(npx, ["next", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
