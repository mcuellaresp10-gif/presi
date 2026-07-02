# PRESI

Fantasy ownership game for Liga BetPlay (Colombia). Sprint 1 — mock data loop.

## Setup rápido

### 1. Variables de entorno ✅

Copia `.env.example` → `.env.local` y completa las keys desde **Supabase Dashboard → Project Settings → API**:

| Variable | Qué copiar |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon** o **publishable** (`eyJ...` o `sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (solo servidor, nunca `NEXT_PUBLIC_`) |

```bash
npm run check:env   # valida que las keys tengan el formato correcto
```

> ⚠️ **Error común:** poner `sb_secret_...` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Esa es la clave privada y no debe exponerse en el navegador. Si lo hiciste, cámbiala por la anon/publishable y rota la secret en Supabase.

### 2. Base de datos ✅

Ejecuta en **SQL Editor** (en orden):

1. `supabase/migrations/20260101000000_initial_schema.sql`
2. `supabase/seed.sql`

Verifica: Table Editor → `players_master` debe tener 40 filas.

### 3. Google OAuth — **OPCIONAL**

No es necesario para probar el juego. El registro con **email + contraseña** funciona sin Google.

Solo configura Google si lo quieres:

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth Client ID (Web)
2. Authorized redirect URI: `https://TU_PROYECTO.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google → pega Client ID y Secret
4. Authentication → URL Configuration → Redirect URLs: añade `http://localhost:3000/auth/callback`

### 4. Arrancar la app

```bash
npm install
npm run dev
```

Abre http://localhost:3000 → Regístrate con email/contraseña.

**Si falla el registro:** Supabase Dashboard → Authentication → Providers → Email → desactiva **Confirm email** (para desarrollo).

### 5. Cron de instalaciones — **sin CLI**

No necesitas `supabase functions deploy` para el Sprint 1.

**Opción A (recomendada, solo SQL):**

1. Dashboard → Database → Extensions → activa **pg_cron**
2. SQL Editor → ejecuta `supabase/migrations/20260101000002_facility_cron_direct.sql`

Eso llama `complete_facility_upgrades()` cada minuto directamente en Postgres.

**Opción B (Edge Function, requiere Supabase CLI):**

```bash
npm i -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy facility-upgrade-cron
```

Luego programa el cron HTTP en `supabase/migrations/20260101000001_facility_cron.sql`.

## Tests

```bash
npm test
```

## Sprint 1 flow

Registro → Crear club → 4 sobres → Plantilla → Alineación → Instalaciones → Ligas → Ranking
