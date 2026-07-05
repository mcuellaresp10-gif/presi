-- Player performance tiers + uniform 3-jornada contract baseline

alter table players_master
  add column if not exists performance_score numeric,
  add column if not exists stats_updated_at timestamptz;

create index if not exists idx_players_master_rareza on players_master (rareza);
create index if not exists idx_players_master_performance
  on players_master (performance_score desc nulls last);

-- Normalize existing contracts: cap at 3 jornadas for active roster rows
update club_roster
set jornadas_restantes = 3
where jornadas_restantes > 3;

-- Placeholder until sync/backfill runs (keeps DB valid for new reads)
update players_master
set
  costo_base = case rareza
    when 'bronce' then 800000
    when 'plata' then 1600000
    when 'oro' then 2800000
    when 'leyenda' then 4200000
    else 800000
  end
where api_football_id is not null
  and (costo_base is null or costo_base = 3000000);
