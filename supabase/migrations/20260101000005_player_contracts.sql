-- Hybrid player contracts: jornadas + expiration date

alter table club_roster
  add column if not exists jornadas_restantes integer not null default 3,
  add column if not exists contrato_expira_en timestamptz not null default (now() + interval '7 days'),
  add column if not exists renovaciones integer not null default 0;

alter table clubs
  add column if not exists ultima_jornada_confirmada timestamptz;

-- Backfill existing roster rows by player rarity
update club_roster cr
set
  jornadas_restantes = case pm.rareza
    when 'bronce' then 5
    when 'plata' then 4
    when 'oro' then 3
    when 'leyenda' then 2
    else 3
  end,
  contrato_expira_en = now() + case pm.rareza
    when 'bronce' then interval '14 days'
    when 'plata' then interval '10 days'
    when 'oro' then interval '7 days'
    when 'leyenda' then interval '5 days'
    else interval '7 days'
  end,
  renovaciones = 0
from players_master pm
where cr.player_id = pm.id;
