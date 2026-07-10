-- Allow ranking to list every club that finished onboarding.
-- Existing "own club" policy remains; policies are OR'd for SELECT.

drop policy if exists "Authenticated view completed clubs for ranking" on clubs;
create policy "Authenticated view completed clubs for ranking"
  on clubs
  for select
  to authenticated
  using (onboarding_completado = true);

-- Public projection (id, name, crest only) for ranking UIs.
create or replace view public.clubs_public_ranking as
select
  id,
  nombre,
  escudo_config
from public.clubs
where onboarding_completado = true;

alter view public.clubs_public_ranking set (security_invoker = false);

revoke all on public.clubs_public_ranking from public;
revoke all on public.clubs_public_ranking from anon;
grant select on public.clubs_public_ranking to authenticated;
grant select on public.clubs_public_ranking to service_role;
