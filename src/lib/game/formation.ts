import type { Player } from "./types";

export const VALID_FORMATIONS = [
  { def: 3, med: 4, del: 3, label: "3-4-3" },
  { def: 3, med: 5, del: 2, label: "3-5-2" },
  { def: 4, med: 4, del: 2, label: "4-4-2" },
  { def: 4, med: 3, del: 3, label: "4-3-3" },
  { def: 4, med: 5, del: 1, label: "4-5-1" },
  { def: 5, med: 3, del: 2, label: "5-3-2" },
  { def: 5, med: 4, del: 1, label: "5-4-1" },
] as const;

const FORMATION_LABELS = VALID_FORMATIONS.map((f) => f.label).join(", ");

export type FormationResult =
  | { valid: true; formation: string }
  | { valid: false; error: string };

export function validateFormation(starters: Player[]): FormationResult {
  if (starters.length !== 11) {
    return {
      valid: false,
      error: `Debes seleccionar exactamente 11 titulares. Tienes ${starters.length}.`,
    };
  }

  const counts = starters.reduce(
    (acc, player) => {
      acc[player.posicion] += 1;
      return acc;
    },
    { GK: 0, DEF: 0, MED: 0, DEL: 0 }
  );

  if (counts.GK !== 1) {
    return {
      valid: false,
      error: "Debes tener exactamente 1 portero titular.",
    };
  }

  if (counts.DEF + counts.MED + counts.DEL !== 10) {
    return {
      valid: false,
      error: "Los 10 jugadores de campo deben completar la formación.",
    };
  }

  const match = VALID_FORMATIONS.find(
    (formation) =>
      formation.def === counts.DEF &&
      formation.med === counts.MED &&
      formation.del === counts.DEL
  );

  if (!match) {
    return {
      valid: false,
      error: `Tu alineación ${counts.DEF}-${counts.MED}-${counts.DEL} no es válida. Formaciones permitidas: ${FORMATION_LABELS}.`,
    };
  }

  return { valid: true, formation: match.label };
}

export function getFormationSlots(formationLabel: string): {
  GK: number;
  DEF: number;
  MED: number;
  DEL: number;
} {
  const formation = VALID_FORMATIONS.find((f) => f.label === formationLabel);
  if (!formation) {
    return { GK: 1, DEF: 4, MED: 4, DEL: 2 };
  }
  return {
    GK: 1,
    DEF: formation.def,
    MED: formation.med,
    DEL: formation.del,
  };
}
