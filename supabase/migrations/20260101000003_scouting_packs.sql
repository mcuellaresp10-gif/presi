-- Scouting pack timer loop (independent from facility upgrade timers)

create table scouting_packs (
  club_id uuid primary key references clubs,
  genera_en timestamptz not null,
  player_id uuid references players_master,
  estado text not null default 'timer'
    check (estado in ('timer', 'listo', 'reclamado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table scouting_packs enable row level security;

create policy "Users can manage own scouting packs"
  on scouting_packs for all using (
    exists (
      select 1 from clubs where clubs.id = scouting_packs.club_id and clubs.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from clubs where clubs.id = scouting_packs.club_id and clubs.user_id = auth.uid()
    )
  );

-- Backfill existing clubs (24h initial timer at level 1)
insert into scouting_packs (club_id, genera_en, estado)
select c.id, now() + interval '24 hours', 'timer'
from clubs c
where not exists (
  select 1 from scouting_packs sp where sp.club_id = c.id
);
