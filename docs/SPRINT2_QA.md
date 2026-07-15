# Sprint 2 — QA de cierre

## Verificado en código / CI local (cierre implementación)

| Check | Resultado |
|-------|-----------|
| `npm test` | Suite unitaria (incl. `applyGymGameweekBonus`, effective lineup parcial + auto-sub) |
| `npm run check:env` | Supabase + avisos API_FOOTBALL / CRON_SECRET |
| Motor gimnasio | `%` aplicado en `processor` al total de jornada |
| Ranking | Sin `gym_bonus_pct` / badge |
| `/inicio` | `GameweekPointsPanel` montado (desglose) |
| Cron prod | `.github/workflows/gameweek-cron.yml` (cada 5 min) |
| Docs | `SPRINT2_DESIGN`, `SPRINT2_CHECKLIST`, `README`, `FACILITIES` alineados |

## QA manual post-deploy (pendiente de jornada live)

Marcar en [`SPRINT2_CHECKLIST.md`](SPRINT2_CHECKLIST.md) § «Probar loop Sprint 2»:

1. Secrets GHA: `PROD_BASE_URL`, `CRON_SECRET` (mismo valor en Render/host).
2. Con jornada `live`, el workflow o curl no debe devolver solo `no_live_gameweek`.
3. Subir gimnasio → total de jornada mayor tras recálculo; ranking sin etiqueta gym.
4. Desglose en Inicio refleja jugadores / auto-sub.
5. Contratos y reserva según diseño.

Hasta no haber jornada live real, el sprint se considera **cerrado en implementación**; el checklist de loop live queda como gate operativo de temporada.
