# Sprint 2 — Checklist

## SQL (en orden)

Migraciones en `supabase/migrations/` (aplicar en el proyecto Supabase si aún no están):

- [x] `20260101000003_scouting_packs.sql`
- [x] `20260101000004_facilities_v2.sql`
- [x] `20260101000005_player_contracts.sql`
- [x] `20260101000006_sprint2_gameweeks.sql`
- [x] `20260101000008_wild_cards.sql` — Wild Cards scouting
- [x] `20260101000009_captain.sql` — Capitán en alineación (puntos x2)
- [x] `20260101000010_scoring_stats.sql` — stats extendidos + scores en fixtures
- [x] `20260101000011_facility_level_cap.sql` — cap nivel instalaciones 1–10
- [x] `20260101000007_sprint2_gameweek_cron.sql` (stub; cron real vía HTTP)

> También existen migraciones posteriores (12–21): tienda, tiers, drafts parciales, ranking global, etc. Aplicarlas en orden.

## Variables `.env.local`

- [ ] `API_FOOTBALL_KEY`
- [ ] `API_FOOTBALL_LEAGUE_ID=239` (Liga Colombiana)
- [ ] `API_FOOTBALL_SEASON`
- [ ] `CRON_SECRET` — **requerido en producción** (mismo valor en host + GitHub Secrets)

```bash
npm run check:env   # Supabase obligatorio; API_FOOTBALL_* / CRON_SECRET avisos
```

## Cron jornadas

El endpoint **no hace nada pesado** si no hay jornada con `status = live`.  
Respuesta típica sin partidos: `{ "skipped": true, "reason": "no_live_gameweek" }`.

### Desarrollo local — cada 30 segundos

Terminal 1: `npm run dev`  
Terminal 2:

```powershell
$env:BASE_URL="http://localhost:3000"
npm run cron:gameweek
```

O una sola llamada manual:

```powershell
curl -X POST http://localhost:3000/api/cron/gameweek
```

Si `CRON_SECRET` está definido, agrega:
`-H "Authorization: Bearer TU_CRON_SECRET"`

### Producción

1. **GitHub Actions** (incluido): [`.github/workflows/gameweek-cron.yml`](../.github/workflows/gameweek-cron.yml) cada **5 min**.
   - Secrets del repo: `PROD_BASE_URL`, `CRON_SECRET`
   - En el host: misma `CRON_SECRET` + `API_FOOTBALL_*`
2. **Intervalo ~30 s** (opcional en jornadas live): [cron-job.org](https://cron-job.org) → `POST {PROD_BASE_URL}/api/cron/gameweek` con header Bearer.

## Reglas de producto (cierre)

- Alineación **parcial** puntúa jugadores alineados; titular 0 min → auto-sub misma posición.
- `isValid` (11+5+formación) es CTA de UI, no anula puntos del club.
- **Gimnasio:** +N% al total de **jornada**; **no** se muestra en ranking global.
- Ranking ordena solo por `club_season_points.total_points`.

## Probar loop Sprint 2 (QA manual post-deploy)

1. [ ] Migraciones aplicadas en el proyecto Supabase objetivo
2. [ ] Sync jugadores/fixtures con temporada correcta (`API_FOOTBALL_*`)
3. [ ] `/plantilla` — guardar alineación (completa o parcial) antes del deadline
4. [ ] Titular 0 min → suplente misma posición puntúa; sin suplente → 0 en ese hueco
5. [ ] Al iniciar jornada — alineación **bloqueada**
6. [ ] `/inicio` — puntos de jornada + countdown + **desglose** (ver desglose)
7. [ ] Reserva **no puntúa** ni consume contrato
8. [ ] Contratos se descuentan solos (≥ 1 min, línea efectiva)
9. [ ] Gimnasio sube el total de jornada; ranking **sin** badge `+X% gimnasio`
10. [ ] `/ranking` — puntos desde `club_season_points` (NPC a 0 hasta que arranque la liga)
11. [ ] **No** existe botón «Confirmar jornada»
12. [ ] Cron prod responde 200 (GHA o curl con `CRON_SECRET`)

## Comandos

```bash
npm test
npm run build
npm run check:env
npm run dev
npm run cron:gameweek   # loop 30s (solo útil con jornada live)
```

## Documentación

- Diseño: `docs/SPRINT2_DESIGN.md`
- Estado QA cierre: `docs/SPRINT2_QA.md`
- Puntuación: `docs/SCORING.md`
- Instalaciones: `docs/FACILITIES.md`
