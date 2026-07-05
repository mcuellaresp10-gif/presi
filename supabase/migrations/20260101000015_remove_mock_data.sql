-- Eliminar jugadores ficticios, ranking mock y fixtures de desarrollo
-- Orden: desreferenciar FKs nullable → borrar dependientes → borrar jugadores mock

-- Sesiones de sobres de bienvenida (elegido_id → players_master)
update welcome_pack_sessions
set elegido_id = null
where elegido_id in (
  select id from players_master where api_football_id is null
);

-- Packs de scouting / academia con jugador mock reservado
update scouting_packs
set player_id = null
where player_id in (
  select id from players_master where api_football_id is null
);

update academy_packs
set player_id = null
where player_id in (
  select id from players_master where api_football_id is null
);

-- Alineaciones que incluyen jugadores mock (no se puede recortar arrays sin romper 11+5)
delete from lineup_drafts
where captain_id in (select id from players_master where api_football_id is null)
   or starter_ids && coalesce(
     (select array_agg(id) from players_master where api_football_id is null),
     '{}'::uuid[]
   )
   or bench_ids && coalesce(
     (select array_agg(id) from players_master where api_football_id is null),
     '{}'::uuid[]
   );

delete from lineup_snapshots
where captain_id in (select id from players_master where api_football_id is null)
   or starter_ids && coalesce(
     (select array_agg(id) from players_master where api_football_id is null),
     '{}'::uuid[]
   )
   or bench_ids && coalesce(
     (select array_agg(id) from players_master where api_football_id is null),
     '{}'::uuid[]
   );

-- Mercado de préstamos con ofertas mock en JSON (se regenera solo)
delete from loan_market_state
where exists (
  select 1
  from players_master mp,
       jsonb_array_elements(offers) elem
  where mp.api_football_id is null
    and (elem->>'playerId')::uuid = mp.id
);

delete from player_match_stats
where player_id in (
  select id from players_master where api_football_id is null
);

delete from contract_gameweek_log
where player_id in (
  select id from players_master where api_football_id is null
);

delete from club_roster
where player_id in (
  select id from players_master where api_football_id is null
);

delete from players_master where api_football_id is null;

delete from ranking_mock;

delete from fixtures
where home_team in ('Mock FC', 'Dev United')
   or api_football_fixture_id >= 900000;
