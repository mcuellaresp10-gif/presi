# PRESI

Fantasy ownership game for **Liga Colombiana**. Sprint 2: jornadas reales (API-Football), plantilla 11+5+reserva, puntos y contratos automáticos.

## Setup rápido

### 1. Variables de entorno

Copia `.env.example` → `.env.local` y completa las keys desde **Supabase Dashboard → Project Settings → API**:

| Variable | Qué copiar |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon** o **publishable** (`eyJ...` o `sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (solo servidor, nunca `NEXT_PUBLIC_`) |
| `API_FOOTBALL_KEY` | Key API-Football (sync jugadores/fixtures) |
| `API_FOOTBALL_LEAGUE_ID` | `239` (Liga Colombiana) |
| `API_FOOTBALL_SEASON` | Temporada API (ej. `2025`) |
| `CRON_SECRET` | Obligatorio en producción para `/api/cron/gameweek` |

```bash
npm run check:env   # valida Supabase; avisa API_FOOTBALL_* / CRON_SECRET
```

> ⚠️ **Error común:** poner `sb_secret_...` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Esa es la clave privada y no debe exponerse en el navegador.

### 2. Base de datos

Ejecuta en **SQL Editor** las migraciones de `supabase/migrations/` en orden (empezando por `20260101000000_initial_schema.sql`).

Ver checklist: [`docs/SPRINT2_CHECKLIST.md`](docs/SPRINT2_CHECKLIST.md).

### 3. Google OAuth — opcional

El registro con **email + contraseña** funciona sin Google.

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth Client ID (Web)
2. Authorized redirect URI: `https://TU_PROYECTO.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google
4. URL Configuration: Site URL + Redirect URLs (`localhost` y producción)

### 4. Arrancar la app

```bash
npm install
npm run dev
```

Abre http://localhost:3000

### 5. Cron de jornadas

- **Local:** `npm run cron:gameweek` (POST cada 30s a `/api/cron/gameweek`)
- **Producción:** GitHub Actions [`.github/workflows/gameweek-cron.yml`](.github/workflows/gameweek-cron.yml) cada 5 min (`PROD_BASE_URL` + `CRON_SECRET` secrets). Para ~30s en live, usa cron-job.org al mismo endpoint.

### 6. Cron de instalaciones

1. Dashboard → Database → Extensions → **pg_cron**
2. SQL Editor → `supabase/migrations/20260101000002_facility_cron_direct.sql`

## Flow del juego

Registro → Crear club → Sobres → Plantilla (11+banca) → Instalaciones → Ligas → Ranking

Durante la jornada: el cron sync stats → lock alineación → puntos en vivo (incl. % gimnasio) → contratos → season totals.

## Documentación

| Tema | Doc |
|------|-----|
| Diseño Sprint 2 | [`docs/SPRINT2_DESIGN.md`](docs/SPRINT2_DESIGN.md) |
| Checklist / QA | [`docs/SPRINT2_CHECKLIST.md`](docs/SPRINT2_CHECKLIST.md), [`docs/SPRINT2_QA.md`](docs/SPRINT2_QA.md) |
| Puntuación | [`docs/SCORING.md`](docs/SCORING.md) |
| Instalaciones | [`docs/FACILITIES.md`](docs/FACILITIES.md) |

## Tests

```bash
npm test
npm run build
```
