-- Opción SIN Supabase CLI: ejecuta esto en SQL Editor después de la migración inicial.
-- Completa mejoras de instalaciones cada minuto llamando la función directamente.
--
-- Requiere extensión pg_cron (Supabase Dashboard → Database → Extensions → pg_cron).

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Eliminar job previo si existe (re-ejecutar migración)
select cron.unschedule(jobid)
from cron.job
where jobname = 'presi-facility-upgrades';

select cron.schedule(
  'presi-facility-upgrades',
  '* * * * *',
  $$select public.complete_facility_upgrades();$$
);
