-- Capitán por jornada: elegido entre los 11 titulares, puntos x2 al calcular jornada

alter table lineup_drafts
  add column if not exists captain_id uuid references players_master;

alter table lineup_snapshots
  add column if not exists captain_id uuid references players_master;

comment on column lineup_drafts.captain_id is
  'Jugador capitán del 11 inicial; debe estar en starter_ids al guardar.';
comment on column lineup_snapshots.captain_id is
  'Capitán congelado al bloquear la alineación.';
