-- VS jornada rivalries: snapshot rival at lock, settle rewards when GW finishes.

alter table clubs
  add column if not exists vs_win_streak integer not null default 0
    check (vs_win_streak >= 0),
  add column if not exists pending_vs_streak_reward jsonb null;

create table if not exists club_gameweek_vs (
  club_id uuid not null references clubs(id) on delete cascade,
  gameweek_id uuid not null references gameweeks(id) on delete cascade,
  rival_club_id uuid null references clubs(id) on delete set null,
  my_points integer null,
  rival_points integer null,
  outcome text null check (outcome in ('win', 'loss', 'draw', 'no_rival')),
  gems_awarded integer not null default 0,
  streak_after integer not null default 0,
  streak_pack_granted boolean not null default false,
  settled_at timestamptz null,
  created_at timestamptz not null default now(),
  primary key (club_id, gameweek_id)
);

create index if not exists club_gameweek_vs_gameweek_idx
  on club_gameweek_vs (gameweek_id);

alter table club_gameweek_vs enable row level security;

drop policy if exists "Users can view own vs results" on club_gameweek_vs;
create policy "Users can view own vs results"
  on club_gameweek_vs for select using (
    exists (
      select 1 from clubs
      where clubs.id = club_gameweek_vs.club_id
        and clubs.user_id = auth.uid()
    )
  );

-- Settlements run via service role / cron; no user inserts/updates needed.
