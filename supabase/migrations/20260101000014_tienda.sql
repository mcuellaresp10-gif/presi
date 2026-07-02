-- Tienda: gemas, mercado de préstamos 12h, columnas de préstamo en roster

alter table clubs
  add column if not exists gemas integer not null default 150;

update clubs set gemas = 150 where gemas is null or gemas < 0;

alter table club_roster
  add column if not exists es_prestamo boolean not null default false,
  add column if not exists prestamo_jornadas_restantes integer;

create table if not exists loan_market_state (
  club_id uuid primary key references clubs on delete cascade,
  refresh_en timestamptz not null,
  offers jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table loan_market_state enable row level security;

create policy "Users can manage own loan market"
  on loan_market_state for all using (
    exists (
      select 1 from clubs where clubs.id = loan_market_state.club_id and clubs.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from clubs where clubs.id = loan_market_state.club_id and clubs.user_id = auth.uid()
    )
  );
