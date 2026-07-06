import type { EscudoConfig, EscudoPattern } from "@/lib/game/types";

export const DEFAULT_ESCUDO: EscudoConfig = {
  shapeId: 1,
  iconId: 1,
  primaryColor: "#070B18",
  secondaryColor: "#F5C518",
  accentColor: "#22D3EE",
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
    name: "Oro y azul PRESI",
    primaryColor: "#070B18",
    secondaryColor: "#F5C518",
    accentColor: "#22D3EE",
  },
  {
    id: "verde",
    name: "Verde y blanco",
    primaryColor: "#0B5E2E",
    secondaryColor: "#FFFFFF",
    accentColor: "#C9A227",
  },
  {
    id: "rojo-azul",
    name: "Rojo y azul",
    primaryColor: "#B91C1C",
    secondaryColor: "#1E3A8A",
    accentColor: "#F5C518",
  },
  {
    id: "america",
    name: "Amarillo y rojo",
    primaryColor: "#EAB308",
    secondaryColor: "#DC2626",
    accentColor: "#1F2937",
  },
  {
    id: "negro-oro",
    name: "Negro y dorado",
    primaryColor: "#111827",
    secondaryColor: "#D4AF37",
    accentColor: "#FFFFFF",
  },
  {
    id: "turquesa",
    name: "Turquesa y navy",
    primaryColor: "#0F172A",
    secondaryColor: "#22D3EE",
    accentColor: "#F5C518",
  },
];

/** Maps legacy templateId (1–8) to v2 shape + icon. */
export const LEGACY_TEMPLATE_MAP: Record<
  number,
  { shapeId: number; iconId: number }
> = {
  1: { shapeId: 1, iconId: 1 },
  2: { shapeId: 1, iconId: 2 },
  3: { shapeId: 2, iconId: 3 },
  4: { shapeId: 2, iconId: 4 },
  5: { shapeId: 3, iconId: 5 },
  6: { shapeId: 3, iconId: 6 },
  7: { shapeId: 4, iconId: 7 },
  8: { shapeId: 4, iconId: 8 },
};

/** @deprecated Use ESCUDO_SHAPES + ESCUDO_ICONS */
export const ESCUDO_TEMPLATES = [
  { id: 1, name: "Clásico · Balón" },
  { id: 2, name: "Clásico · Águila" },
  { id: 3, name: "Redondeado · Estrella" },
  { id: 4, name: "Redondeado · Torre" },
  { id: 5, name: "Punta abajo · Rayo" },
  { id: 6, name: "Punta abajo · Café" },
  { id: 7, name: "Ancho · Montaña" },
  { id: 8, name: "Ancho · Sol" },
];

export const CLUB_STYLE_OPTIONS = [
  "Tradicional",
  "Joven",
  "Agresivo",
  "Técnico",
] as const;

export type ClubStyle = (typeof CLUB_STYLE_OPTIONS)[number];

export const CITY_SUGGESTIONS = [
  "Bogotá FC",
  "Villa Andina",
  "Puerto Dorado",
  "Medellín Sur",
  "Costa Verde",
  "Altiplano United",
] as const;

export function buildRandomEscudo(): EscudoConfig {
  const shape =
    ESCUDO_SHAPES[Math.floor(Math.random() * ESCUDO_SHAPES.length)]!;
  const icon =
    ESCUDO_ICONS[Math.floor(Math.random() * ESCUDO_ICONS.length)]!;
  const palette =
    ESCUDO_COLOR_PALETTES[
      Math.floor(Math.random() * ESCUDO_COLOR_PALETTES.length)
    ]!;
  const pattern =
    ESCUDO_PATTERNS[Math.floor(Math.random() * ESCUDO_PATTERNS.length)]!;

  return {
    shapeId: shape.id,
    iconId: icon.id,
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
    pattern: pattern.id,
  };
}

export function applyPalette(
  config: EscudoConfig,
  palette: EscudoColorPalette
): EscudoConfig {
  return {
    ...config,
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
  };
}
