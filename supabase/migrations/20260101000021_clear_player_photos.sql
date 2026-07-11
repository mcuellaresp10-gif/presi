-- Remove stored player likeness URLs (image rights / legal risk).
-- UI already shows initials only; clear existing data so URLs are not retained.

update public.players_master
set photo_url = null
where photo_url is not null;
