import {
  DEFAULT_ESCUDO,
  ESCUDO_ICONS,
  ESCUDO_PATTERNS,
  ESCUDO_SHAPES,
  LEGACY_TEMPLATE_MAP,
} from "@/lib/game/escudo-presets";
import type { EscudoConfig, EscudoPattern } from "@/lib/game/types";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function clampId(value: unknown, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1 || n > max) return fallback;
  return Math.floor(n);
}

function sanitizeHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.startsWith("#") ? value : `#${value}`;
  return HEX_RE.test(normalized) ? normalized.toUpperCase() : fallback;
}

function sanitizePattern(value: unknown): EscudoPattern {
  const valid = ESCUDO_PATTERNS.map((p) => p.id);
  if (typeof value === "string" && valid.includes(value as EscudoPattern)) {
    return value as EscudoPattern;
  }
  return "solid";
}

/** Normalizes v1 (templateId) and partial configs to full v2 EscudoConfig. */
export function normalizeEscudoConfig(
  raw: Partial<EscudoConfig> & { templateId?: number }
): EscudoConfig {
  let shapeId = raw.shapeId;
  let iconId = raw.iconId;

  if (
    (shapeId == null || iconId == null) &&
    raw.templateId != null &&
    LEGACY_TEMPLATE_MAP[raw.templateId]
  ) {
    const mapped = LEGACY_TEMPLATE_MAP[raw.templateId]!;
    shapeId = shapeId ?? mapped.shapeId;
    iconId = iconId ?? mapped.iconId;
  }

  const primaryColor = sanitizeHex(
    raw.primaryColor,
    DEFAULT_ESCUDO.primaryColor
  );
  let secondaryColor = sanitizeHex(
    raw.secondaryColor,
    DEFAULT_ESCUDO.secondaryColor
  );
  const accentColor = sanitizeHex(
    raw.accentColor ?? DEFAULT_ESCUDO.accentColor,
    DEFAULT_ESCUDO.accentColor!
  );

  if (primaryColor === secondaryColor) {
    secondaryColor = DEFAULT_ESCUDO.secondaryColor;
  }

  return {
    shapeId: clampId(shapeId, ESCUDO_SHAPES.length, DEFAULT_ESCUDO.shapeId),
    iconId: clampId(iconId, ESCUDO_ICONS.length, DEFAULT_ESCUDO.iconId),
    primaryColor,
    secondaryColor,
    accentColor,
    pattern: sanitizePattern(raw.pattern),
    ...(raw.templateId != null ? { templateId: raw.templateId } : {}),
  };
}

export function sanitizeEscudoConfig(
  raw: unknown
): { ok: true; config: EscudoConfig } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Escudo inválido." };
  }
  const config = normalizeEscudoConfig(raw as Partial<EscudoConfig>);
  return { ok: true, config };
}
