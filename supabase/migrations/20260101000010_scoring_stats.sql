-- Extended player stats for FIFA-style position scoring

alter table fixtures
  add column if not exists home_goals integer,
  add column if not exists away_goals integer;

alter table player_match_stats
  add column if not exists started boolean not null default false,
  add column if not exists team_side text check (team_side in ('home', 'away')),
  add column if not exists team_result text check (team_result in ('win', 'draw', 'loss')),
  add column if not exists saves integer not null default 0,
  add column if not exists passes_accurate integer not null default 0,
  add column if not exists tackles_won integer not null default 0,
  add column if not exists dribbles_success integer not null default 0,
  add column if not exists key_passes integer not null default 0,
  add column if not exists big_chances_created integer not null default 0,
  add column if not exists fouls_drawn integer not null default 0,
  add column if not exists duels_won integer not null default 0,
  add column if not exists duels_lost integer not null default 0,
  add column if not exists fouls_committed integer not null default 0;
