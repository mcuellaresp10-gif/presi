import type { EscudoConfig, EscudoPattern } from "@/lib/game/types";

export const DEFAULT_ESCUDO: EscudoConfig = {
  shapeId: 1,
  iconId: 1,
  primaryColor: "#0E0718",
  secondaryColor: "#F5F147",
  accentColor: "#F57847",
  pattern: "solid",
};

export const ESCUDO_SHAPES = [
  { id: 1, name: "Clásico" },
  { id: 2, name: "Redondeado" },
  { id: 3, name: "Punta abajo" },
  { id: 4, name: "Ancho" },
  { id: 5, name: "Moderno" },
  { id: 6, name: "Circular" },
] as const;

export const ESCUDO_ICONS = [
  { id: 1, name: "Balón" },
  { id: 2, name: "Águila" },
  { id: 3, name: "Estrella" },
  { id: 4, name: "Torre" },
  { id: 5, name: "Rayo" },
  { id: 6, name: "Café" },
  { id: 7, name: "Montaña" },
  { id: 8, name: "Sol" },
  { id: 9, name: "Palma" },
  { id: 10, name: "León" },
  { id: 11, name: "Cóndor" },
  { id: 12, name: "Corona" },
] as const;

export const ESCUDO_PATTERNS: { id: EscudoPattern; name: string }[] = [
  { id: "solid", name: "Sólido" },
  { id: "vertical", name: "Rayas verticales" },
  { id: "horizontal", name: "Rayas horizontales" },
  { id: "diagonal", name: "Diagonal" },
];

export type EscudoColorPalette = {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export const ESCUDO_COLOR_PALETTES: EscudoColorPalette[] = [
  {
    id: "presi",
    name: "Neon PRESI",
    primaryColor: "#0E0718",
    secondaryColor: "#F5F147",
    accentColor: "#F57847",
  },
  {
    id: "violet-sand",
    name: "Violeta y arena",
    primaryColor: "#9247F5",
    secondaryColor: "#E0CBB2",
    accentColor: "#F5F147",
  },
  {
    id: "coral-olive",
    name: "Coral y oliva",
    primaryColor: "#F57847",
    secondaryColor: "#8C955D",
    accentColor: "#0E0718",
  },
  {
    id: "gold-coral",
    name: "Oro y coral",
    primaryColor: "#F5F147",
    secondaryColor: "#F57847",
    accentColor: "#9247F5",
  },
  {
    id: "sand-gold",
    name: "Arena y oro",
    primaryColor: "#E0CBB2",
    secondaryColor: "#F5F147",
    accentColor: "#0E0718",
  },
  {
    id: "olive-night",
    name: "Oliva nocturno",
    primaryColor: "#8C955D",
    secondaryColor: "#0E0718",
    accentColor: "#F57847",
  },
];

/** Maps legacy templateId (1–8) to v2 shape + icon. */
export const LEGACY_TEMPLATE_MAP: Record<
  number,
  { shapeId: number; iconId: number }
> = {
  1: { shapeId: 1, iconId: 1 },
  2: { shapeId: 2, iconId: 2 },
  3: { shapeId: 3, iconId: 3 },
  4: { shapeId: 4, iconId: 4 },
  5: { shapeId: 5, iconId: 5 },
  6: { shapeId: 6, iconId: 10 },
  7: { shapeId: 1, iconId: 7 },
  8: { shapeId: 2, iconId: 12 },
};
