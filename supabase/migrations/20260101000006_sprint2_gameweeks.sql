-- Sprint 2: jornadas reales, lineups 11+5, stats y puntos
-- Idempotente: seguro si gameweeks u otras tablas ya existen

create table if not exists gameweeks (
  id uuid primary key default gen_random_uuid(),
  season integer not null,
  round integer not null,
  first_kickoff_at timestamptz not null,
  last_kickoff_at timestamptz,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'live', 'finished')),
  created_at timestamptz default now(),
  unique (season, round)
);

create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  gameweek_id uuid references gameweeks not null,
  api_football_fixture_id integer unique not null,
  kickoff_at timestamptz not null,
  home_team text not null,
  away_team text not null,
  status text not null default 'NS',
  updated_at timestamptz default now()
);

create index if not exists fixtures_gameweek_idx on fixtures (gameweek_id);

create table if not exists player_match_stats (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references fixtures not null,
  player_id uuid references players_master not null,
  gameweek_id uuid references gameweeks not null,
  minutes integer not null default 0,
  goals integer not null default 0,
  assists integer not null default 0,
  yellow_cards integer not null default 0,
  red_cards integer not null default 0,
  clean_sheet boolean default false,
  goals_conceded integer default 0,
  updated_at timestamptz default now(),
  unique (fixture_id, player_id)
);

create index if not exists player_match_stats_gameweek_idx on player_match_stats (gameweek_id);
create index if not exists player_match_stats_player_idx on player_match_stats (player_id);

create table if not exists lineup_drafts (
  club_id uuid references clubs not null,
  gameweek_id uuid references gameweeks not null,
  starter_ids uuid[] not null,
  bench_ids uuid[] not null,
  formation text,
  updated_at timestamptz default now(),
  primary key (club_id, gameweek_id),
  check (cardinality(starter_ids) = 11),
  check (cardinality(bench_ids) = 5)
);

create table if not exists lineup_snapshots (
  club_id uuid references clubs not null,
  gameweek_id uuid references gameweeks not null,
  starter_ids uuid[] not null default '{}',
  bench_ids uuid[] not null default '{}',
  formation text,
  is_valid boolean not null default false,
  locked_at timestamptz not null default now(),
  primary key (club_id, gameweek_id)
);

create table if not exists club_gameweek_points (
  club_id uuid references clubs not null,
  gameweek_id uuid references gameweeks not null,
  points numeric not null default 0,
  breakdown jsonb default '[]'::jsonb,
  calculated_at timestamptz default now(),
  primary key (club_id, gameweek_id)
);

create table if not exists contract_gameweek_log (
  club_id uuid references clubs not null,
  gameweek_id uuid references gameweeks not null,
  player_id uuid references players_master not null,
  applied_at timestamptz default now(),
  primary key (club_id, gameweek_id, player_id)
);

create table if not exists club_season_points (
  club_id uuid references clubs not null,
  season integer not null,
  total_points numeric not null default 0,
  updated_at timestamptz default now(),
  primary key (club_id, season)
);

alter table club_roster
  add column if not exists squad_role text;

-- squad_role check (add only if missing)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'club_roster_squad_role_check'
  ) then
    alter table club_roster
      add constraint club_roster_squad_role_check
      check (squad_role is null or squad_role in ('starter', 'bench', 'reserve'));
  end if;
end $$;

alter table players_master
  add column if not exists photo_url text,
  add column if not exists updated_at timestamptz default now();

-- RLS
alter table gameweeks enable row level security;
alter table fixtures enable row level security;
alter table player_match_stats enable row level security;
alter table lineup_drafts enable row level security;
alter table lineup_snapshots enable row level security;
alter table club_gameweek_points enable row level security;
alter table contract_gameweek_log enable row level security;
alter table club_season_points enable row level security;

drop policy if exists "Authenticated can view gameweeks" on gameweeks;
create policy "Authenticated can view gameweeks"
  on gameweeks for select to authenticated using (true);

drop policy if exists "Authenticated can view fixtures" on fixtures;
create policy "Authenticated can view fixtures"
  on fixtures for select to authenticated using (true);

drop policy if exists "Authenticated can view match stats" on player_match_stats;
create policy "Authenticated can view match stats"
  on player_match_stats for select to authenticated using (true);

drop policy if exists "Users manage own lineup drafts" on lineup_drafts;
create policy "Users manage own lineup drafts"
  on lineup_drafts for all using (
    exists (select 1 from clubs c where c.id = lineup_drafts.club_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from clubs c where c.id = lineup_drafts.club_id and c.user_id = auth.uid())
  );

drop policy if exists "Users view own lineup snapshots" on lineup_snapshots;
create policy "Users view own lineup snapshots"
  on lineup_snapshots for select using (
    exists (select 1 from clubs c where c.id = lineup_snapshots.club_id and c.user_id = auth.uid())
  );

drop policy if exists "Users view own gameweek points" on club_gameweek_points;
create policy "Users view own gameweek points"
  on club_gameweek_points for select using (
    exists (select 1 from clubs c where c.id = club_gameweek_points.club_id and c.user_id = auth.uid())
  );

drop policy if exists "Authenticated view season points" on club_season_points;
create policy "Authenticated view season points"
  on club_season_points for select to authenticated using (true);

drop policy if exists "Users view own contract log" on contract_gameweek_log;
create policy "Users view own contract log"
  on contract_gameweek_log for select using (
    exists (select 1 from clubs c where c.id = contract_gameweek_log.club_id and c.user_id = auth.uid())
  );
