-- Cap scouting pack timers to 12h max (legacy backfill used 24h)

update scouting_packs
set
  genera_en = now() + interval '12 hours',
  updated_at = now()
where estado = 'timer'
  and genera_en > now() + interval '12 hours';
