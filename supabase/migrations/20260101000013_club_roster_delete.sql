-- Permitir liberar jugadores (DELETE en club_roster faltaba en RLS)

drop policy if exists "Users can delete from own roster" on club_roster;
create policy "Users can delete from own roster"
  on club_roster for delete using (
    exists (
      select 1 from clubs
      where clubs.id = club_roster.club_id
        and clubs.user_id = auth.uid()
    )
  );
