-- Cron: pipeline de jornadas cada 10 min (requiere pg_cron + pg_net opcional)
-- Alternativa: llamar POST /api/cron/gameweek con CRON_SECRET desde un scheduler externo

-- Si usas pg_cron sin HTTP, ejecuta manualmente el endpoint desde Vercel Cron / GitHub Actions.

select 1;
