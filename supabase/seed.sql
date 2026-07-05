-- Solo datos estructurales. Jugadores reales vía sync API (syncPlayersFromApi / cron).
-- No insertar jugadores ficticios ni ranking_mock.

insert into leagues (id, nombre, tipo, codigo_invitacion, created_by)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Liga Global PRESI',
  'global',
  null,
  null
)
on conflict (id) do nothing;
