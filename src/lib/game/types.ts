export type Position = "GK" | "DEF" | "MED" | "DEL";
export type Rarity = "bronce" | "plata" | "oro" | "leyenda";
export type FacilityType =
  | "hinchas"
  | "scouting"
  | "oficina"
  | "academia"
  | "cuerpo_medico"
  | "gimnasio";

export interface Player {
  id: string;
  api_football_id: number | null;
  nombre: string;
  equipo_real: string;
  posicion: Position;
  rareza: Rarity;
  costo_base: number;
  photo_url?: string | null;
}

export type RosterPlayer = Player & {
  es_titular?: boolean;
  jornadas_restantes?: number;
  renovaciones?: number;
};

export interface PositionCounts {
  GK: number;
  DEF: number;
  MED: number;
  DEL: number;
}

export interface Facility {
  club_id: string;
  tipo: FacilityType;
  nivel: number;
  mejora_inicia_en: string | null;
  mejora_termina_en: string | null;
}

export interface EscudoConfig {
  templateId: number;
  primaryColor: string;
  secondaryColor: string;
}

export const INITIAL_BUDGET = 50_000_000;
export const MAX_STARTER_COST = 35_000_000;

/** @deprecated Use SQUAD_POSITION_CAPS from squad-limits.ts */
export const POSITION_CAPS: PositionCounts = {
  GK: 3,
  DEF: 8,
  MED: 8,
  DEL: 7,
};

export const POSITION_LABELS: Record<Position, string> = {
  GK: "Porteros",
  DEF: "Defensas",
  MED: "Mediocampistas",
  DEL: "Delanteros",
};

export const FACILITY_LABELS: Record<FacilityType, string> = {
  hinchas: "Hinchas",
  scouting: "Centro de scouting",
  oficina: "Oficina",
  academia: "Academia juvenil",
  cuerpo_medico: "Cuerpo médico",
  gimnasio: "Gimnasio",
};

export const FACILITY_ICONS: Record<FacilityType, string> = {
  hinchas: "📣",
  scouting: "🔍",
  oficina: "🏢",
  academia: "🎓",
  cuerpo_medico: "🏥",
  gimnasio: "💪",
};

export const UPGRADE_FACILITY_TYPES: FacilityType[] = [
  "hinchas",
  "scouting",
  "oficina",
  "academia",
  "cuerpo_medico",
  "gimnasio",
];

export type PackEstado = "timer" | "listo" | "reclamado";
