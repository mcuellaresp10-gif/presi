# Sprint 2 — Checklist

## SQL (en orden)

- [ ] `20260101000003_scouting_packs.sql`
- [ ] `20260101000004_facilities_v2.sql`
- [ ] `20260101000005_player_contracts.sql`
- [ ] `20260101000006_sprint2_gameweeks.sql`
- [ ] **`20260101000008_wild_cards.sql`** — Wild Cards scouting
- [ ] **`20260101000009_captain.sql`** — Capitán en alineación (puntos x2)
- [ ] **`20260101000010_scoring_stats.sql`** — stats extendidos + scores en fixtures
- [ ] **`20260101000011_facility_level_cap.sql`** — cap nivel instalaciones 1–10
- [ ] `20260101000007_sprint2_gameweek_cron.sql` (nota; usar cron HTTP)

## Variables `.env.local`

- [ ] `API_FOOTBALL_KEY`
- [ ] `API_FOOTBALL_LEAGUE_ID=239` (Liga BetPlay)
- [ ] `API_FOOTBALL_SEASON`
- [ ] `CRON_SECRET` — **opcional por ahora** (solo para producción)

## Cron jornadas (solo cuando hay partidos en vivo)

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

Si más adelante activas `CRON_SECRET` en `.env.local`, agrega el header:
`-H "Authorization: Bearer TU_CRON_SECRET"`

### Producción

Programa un scheduler (GitHub Actions, cron-job.org, etc.) que llame al endpoint **cada 30 s**.  
Si no hay partidos en vivo, el servidor responde al instante sin consumir API-Football.

## Probar loop Sprint 2

1. [ ] Migraciones aplicadas
2. [ ] `/plantilla` — guardar **11 inicial + banca (5)** antes del deadline
3. [ ] Sin alineación válida → **0 puntos** esa jornada
4. [ ] Al iniciar jornada (mock o real) — alineación **bloqueada**
5. [ ] `/inicio` — puntos de jornada **en vivo** + countdown real
6. [ ] Auto-sustitución estricta (titular 0 min → banca misma posición)
7. [ ] Reserva **no puntúa** ni consume contrato
8. [ ] Contratos se descuentan solos (≥ 1 min, línea efectiva)
9. [ ] `/ranking` — puntos desde `club_season_points` (fallback mock)
10. [ ] **No** existe botón «Confirmar jornada»

## Comandos

```bash
npm test
npm run build
npm run dev
npm run cron:gameweek   # loop 30s (solo útil con jornada live)
```

## Documentación

- Diseño: `docs/SPRINT2_DESIGN.md`
- Puntuación: `docs/SCORING.md`
- Instalaciones: `docs/FACILITIES.md`
