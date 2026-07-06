-- Separa jornadas por semestre (Apertura / Clausura) — evita mezclar partidos de enero con julio.

alter table gameweeks
  add column if not exists tournament_phase text not null default 'clausura';

alter table gameweeks
  drop constraint if exists gameweeks_season_round_key;

alter table gameweeks
  drop constraint if exists gameweeks_tournament_phase_check;

alter table gameweeks
  add constraint gameweeks_tournament_phase_check
  check (tournament_phase in ('apertura', 'clausura'));

create unique index if not exists gameweeks_season_phase_round_idx
  on gameweeks (season, tournament_phase, round);

-- Etiquetar jornadas existentes según la fecha del primer partido.
update gameweeks
set tournament_phase = case
  when extract(month from first_kickoff_at at time zone 'UTC') >= 7 then 'clausura'
  else 'apertura'
end
where tournament_phase = 'clausura'
  or tournament_phase = 'apertura';
