-- Permitir borradores parciales (menos de 11 titulares / 5 banca) hasta completar alineación.

alter table lineup_drafts
  drop constraint if exists lineup_drafts_starter_ids_check;

alter table lineup_drafts
  drop constraint if exists lineup_drafts_bench_ids_check;

alter table lineup_drafts
  add constraint lineup_drafts_starter_ids_check
  check (cardinality(starter_ids) <= 11);

alter table lineup_drafts
  add constraint lineup_drafts_bench_ids_check
  check (cardinality(bench_ids) <= 5);
