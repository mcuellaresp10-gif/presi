-- Facilities v2: hinchas, oficina, gimnasio + passive income + academy packs

alter table clubs add column if not exists ultimo_ingreso_en timestamptz default now();

-- Drop old check FIRST (inline check from initial_schema may be facilities_tipo_check)
alter table facilities drop constraint if exists facilities_tipo_check;

-- Rename estadio -> hinchas (only safe after constraint removed)
update facilities set tipo = 'hinchas' where tipo = 'estadio';

alter table facilities add constraint facilities_tipo_check
  check (tipo in ('hinchas','scouting','oficina','academia','cuerpo_medico','gimnasio'));

-- Backfill missing facilities for existing clubs
insert into facilities (club_id, tipo, nivel)
select c.id, t.tipo, 1
from clubs c
cross join (
  values ('hinchas'), ('scouting'), ('oficina'), ('academia'), ('cuerpo_medico'), ('gimnasio')
) as t(tipo)
where not exists (
  select 1 from facilities f where f.club_id = c.id and f.tipo = t.tipo
);

-- Academy pack timer loop (independent from scouting)
create table if not exists academy_packs (
  club_id uuid primary key references clubs,
  genera_en timestamptz not null,
  player_id uuid references players_master,
  estado text not null default 'timer'
    check (estado in ('timer', 'listo', 'reclamado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table academy_packs enable row level security;

drop policy if exists "Users can manage own academy packs" on academy_packs;
create policy "Users can manage own academy packs"
  on academy_packs for all using (
    exists (
      select 1 from clubs where clubs.id = academy_packs.club_id and clubs.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from clubs where clubs.id = academy_packs.club_id and clubs.user_id = auth.uid()
    )
  );

-- Backfill academy_packs for existing clubs (96h initial timer at level 1)
insert into academy_packs (club_id, genera_en, estado)
select c.id, now() + interval '96 hours', 'timer'
from clubs c
where not exists (
  select 1 from academy_packs ap where ap.club_id = c.id
);
