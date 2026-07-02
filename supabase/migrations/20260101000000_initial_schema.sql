-- PRESI Sprint 1 initial schema

create table clubs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nombre text not null,
  escudo_config jsonb not null,
  presupuesto numeric not null default 50000000,
  ciudad_ficticia text,
  onboarding_completado boolean default false,
  sobres_restantes integer default 4,
  created_at timestamptz default now()
);

create table players_master (
  id uuid primary key default gen_random_uuid(),
  api_football_id integer,
  nombre text not null,
  equipo_real text not null,
  posicion text not null check (posicion in ('GK','DEF','MED','DEL')),
  rareza text not null check (rareza in ('bronce','plata','oro','leyenda')),
  costo_base numeric not null
);

create table club_roster (
  club_id uuid references clubs not null,
  player_id uuid references players_master not null,
  es_titular boolean default false,
  fecha_fichaje timestamptz default now(),
  primary key (club_id, player_id)
);

create table facilities (
  club_id uuid references clubs not null,
  tipo text not null check (tipo in ('estadio','academia','cuerpo_medico','scouting')),
  nivel integer default 1,
  mejora_inicia_en timestamptz,
  mejora_termina_en timestamptz,
  primary key (club_id, tipo)
);

create table leagues (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('privada','global')),
  codigo_invitacion text unique,
  created_by uuid references auth.users
);

create table league_memberships (
  league_id uuid references leagues not null,
  club_id uuid references clubs not null,
  primary key (league_id, club_id)
);

create table welcome_pack_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs not null,
  pack_number integer not null check (pack_number between 1 and 4),
  opciones jsonb not null,
  elegido_id uuid references players_master,
  abierto_en timestamptz default now(),
  unique (club_id, pack_number)
);

create table ranking_mock (
  id uuid primary key default gen_random_uuid(),
  club_nombre text not null,
  escudo_config jsonb not null,
  puntos integer not null,
  posicion integer not null unique
);

-- RLS
alter table clubs enable row level security;
alter table players_master enable row level security;
alter table club_roster enable row level security;
alter table facilities enable row level security;
alter table leagues enable row level security;
alter table league_memberships enable row level security;
alter table welcome_pack_sessions enable row level security;
alter table ranking_mock enable row level security;

-- clubs policies
create policy "Users can view own club"
  on clubs for select using (auth.uid() = user_id);

create policy "Users can insert own club"
  on clubs for insert with check (auth.uid() = user_id);

create policy "Users can update own club"
  on clubs for update using (auth.uid() = user_id);

-- players_master policies
create policy "Authenticated users can view players"
  on players_master for select to authenticated using (true);

-- club_roster policies
create policy "Users can view own roster"
  on club_roster for select using (
    exists (
      select 1 from clubs where clubs.id = club_roster.club_id and clubs.user_id = auth.uid()
    )
  );

create policy "Users can insert into own roster"
  on club_roster for insert with check (
    exists (
      select 1 from clubs where clubs.id = club_roster.club_id and clubs.user_id = auth.uid()
    )
  );

create policy "Users can update own roster"
  on club_roster for update using (
    exists (
      select 1 from clubs where clubs.id = club_roster.club_id and clubs.user_id = auth.uid()
    )
  );

-- facilities policies
create policy "Users can view own facilities"
  on facilities for select using (
    exists (
      select 1 from clubs where clubs.id = facilities.club_id and clubs.user_id = auth.uid()
    )
  );

create policy "Users can start facility upgrades"
  on facilities for update using (
    exists (
      select 1 from clubs where clubs.id = facilities.club_id and clubs.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from clubs where clubs.id = facilities.club_id and clubs.user_id = auth.uid()
    )
  );

create policy "Users can insert own facilities"
  on facilities for insert with check (
    exists (
      select 1 from clubs where clubs.id = facilities.club_id and clubs.user_id = auth.uid()
    )
  );

-- leagues policies
create policy "Users can view leagues they belong to or global"
  on leagues for select using (
    tipo = 'global'
    or created_by = auth.uid()
    or exists (
      select 1 from league_memberships lm
      join clubs c on c.id = lm.club_id
      where lm.league_id = leagues.id and c.user_id = auth.uid()
    )
  );

create policy "Users can create private leagues"
  on leagues for insert with check (
    tipo = 'privada' and created_by = auth.uid()
  );

-- league_memberships policies
create policy "Users can view own memberships"
  on league_memberships for select using (
    exists (
      select 1 from clubs where clubs.id = league_memberships.club_id and clubs.user_id = auth.uid()
    )
    or exists (
      select 1 from leagues l
      join league_memberships lm on lm.league_id = l.id
      join clubs c on c.id = lm.club_id
      where l.id = league_memberships.league_id and c.user_id = auth.uid()
    )
  );

create policy "Users can join leagues with valid code"
  on league_memberships for insert with check (
    exists (
      select 1 from clubs where clubs.id = league_memberships.club_id and clubs.user_id = auth.uid()
    )
    and exists (
      select 1 from leagues
      where leagues.id = league_memberships.league_id
      and leagues.tipo = 'privada'
      and leagues.codigo_invitacion is not null
    )
  );

create policy "League creators can add memberships"
  on league_memberships for insert with check (
    exists (
      select 1 from leagues
      where leagues.id = league_memberships.league_id
      and leagues.created_by = auth.uid()
    )
  );

-- welcome_pack_sessions policies
create policy "Users can manage own pack sessions"
  on welcome_pack_sessions for all using (
    exists (
      select 1 from clubs where clubs.id = welcome_pack_sessions.club_id and clubs.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from clubs where clubs.id = welcome_pack_sessions.club_id and clubs.user_id = auth.uid()
    )
  );

-- ranking_mock policies
create policy "Anyone authenticated can view ranking"
  on ranking_mock for select to authenticated using (true);

-- Function for cron to complete facility upgrades (service role only)
create or replace function complete_facility_upgrades()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update facilities
  set
    nivel = nivel + 1,
    mejora_inicia_en = null,
    mejora_termina_en = null
  where mejora_termina_en is not null
    and mejora_termina_en <= now();
end;
$$;
