import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envPath = [".env.local", ".env"]
  .map((f) => resolve(process.cwd(), f))
  .find((p) => existsSync(p));

if (!envPath) {
  console.error("❌ No se encontró .env.local ni .env");
  console.error("   Copia .env.example → .env.local y completa las keys.");
  process.exit(1);
}

console.log(`📄 Leyendo ${envPath.split(/[/\\]/).pop()}`);

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

let ok = true;

function check(name, { required = true, pattern, invalidPattern, hint } = {}) {
  const value = env[name];
  if (!value) {
    if (required) {
      console.error(`❌ Falta ${name}`);
      ok = false;
    }
    return;
  }
  if (invalidPattern?.test(value)) {
    console.error(`❌ ${name} parece incorrecta: ${hint}`);
    ok = false;
    return;
  }
  if (pattern && !pattern.test(value)) {
    console.error(`⚠️  ${name} formato inusual — verifica en Supabase Dashboard`);
  } else {
    console.log(`✅ ${name}`);
  }
}

check("NEXT_PUBLIC_SUPABASE_URL", {
  pattern: /^https:\/\/.+\.supabase\.co$/,
});
check("NEXT_PUBLIC_SUPABASE_ANON_KEY", {
  invalidPattern: /^sb_secret_/,
  hint: "pusiste la clave SECRET en una variable pública. Usa anon/publishable (eyJ... o sb_publishable_...)",
});
check("SUPABASE_SERVICE_ROLE_KEY", {
  pattern: /^eyJ/,
  hint: "debe ser el JWT service_role de Supabase",
});

if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("sb_secret_")) {
  console.error("");
  console.error("🔐 URGENTE: La clave secret no debe ir en NEXT_PUBLIC_*.");
  console.error("   Dashboard → Settings → API → copia 'anon' o 'publishable'.");
  console.error("   Luego rota la secret key en Supabase por seguridad.");
}

if (ok) {
  console.log("\n✅ Variables básicas OK. Siguiente: npm run dev");
} else {
  process.exit(1);
}
