-- Cap facility levels at 10 and prevent upgrades beyond max

UPDATE facilities SET nivel = 10 WHERE nivel > 10;

ALTER TABLE facilities
  DROP CONSTRAINT IF EXISTS facilities_nivel_range;

ALTER TABLE facilities
  ADD CONSTRAINT facilities_nivel_range CHECK (nivel >= 1 AND nivel <= 10);

CREATE OR REPLACE FUNCTION complete_facility_upgrades()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE facilities
  SET
    nivel = LEAST(nivel + 1, 10),
    mejora_inicia_en = null,
    mejora_termina_en = null
  WHERE mejora_termina_en IS NOT NULL
    AND mejora_termina_en <= now()
    AND nivel < 10;
END;
$$;
