-- Wild Cards: scouting rewards + club inventory

alter table scouting_packs
  add column if not exists reward_type text not null default 'player'
    check (reward_type in ('player', 'wild_card')),
  add column if not exists wild_card_type text null
    check (
      wild_card_type is null
      or wild_card_type in (
        'free_sign',
        'bench_boost',
        'contract_shield',
        'free_renewal',
        'golden_scout',
        'double_gameweek'
      )
    );

alter table clubs
  add column if not exists scouting_min_rarity text null
    check (scouting_min_rarity is null or scouting_min_rarity in ('oro', 'leyenda'));

create table if not exists club_wild_cards (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  card_type text not null check (
    card_type in (
      'free_sign',
      'bench_boost',
      'contract_shield',
      'free_renewal',
      'golden_scout',
      'double_gameweek'
    )
  ),
  status text not null default 'available'
    check (status in ('available', 'active', 'used')),
  gameweek_id uuid null references gameweeks(id) on delete set null,
  obtained_at timestamptz not null default now(),
  activated_at timestamptz null,
  used_at timestamptz null
);

create index if not exists club_wild_cards_club_status_idx
  on club_wild_cards (club_id, status);

alter table club_wild_cards enable row level security;

create policy "Users can manage own wild cards"
  on club_wild_cards for all using (
    exists (
      select 1 from clubs
      where clubs.id = club_wild_cards.club_id
        and clubs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from clubs
      where clubs.id = club_wild_cards.club_id
        and clubs.user_id = auth.uid()
    )
  );
