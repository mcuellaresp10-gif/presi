"use client";

import { useId } from "react";
import { normalizeEscudoConfig } from "@/lib/game/escudo-sanitize";
import { DEFAULT_ESCUDO } from "@/lib/game/escudo-presets";
import type { EscudoConfig, EscudoPattern } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function KitPatternDefs({
  id,
  pattern,
  primary,
  secondary,
}: {
  id: string;
  pattern: EscudoPattern;
  primary: string;
  secondary: string;
}) {
  if (pattern === "solid") return null;

  if (pattern === "vertical") {
    return (
      <pattern id={id} width="10" height="100" patternUnits="userSpaceOnUse">
        <rect width="5" height="100" fill={primary} />
        <rect x="5" width="5" height="100" fill={secondary} />
      </pattern>
    );
  }

  if (pattern === "horizontal") {
    return (
      <pattern id={id} width="100" height="10" patternUnits="userSpaceOnUse">
        <rect width="100" height="5" fill={primary} />
        <rect y="5" width="100" height="5" fill={secondary} />
      </pattern>
    );
  }

  return (
    <pattern
      id={id}
      width="12"
      height="12"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(35)"
    >
      <rect width="12" height="12" fill={primary} />
      <rect width="6" height="12" fill={secondary} />
    </pattern>
  );
}

/** Flat club jersey SVG derived from escudo colors/pattern (no real kits / photos). */
export function ClubKitRenderer({
  config,
  size = 48,
  number,
  className,
}: {
  config?: EscudoConfig | null;
  size?: number;
  number?: string | number | null;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const escudo = normalizeEscudoConfig(config ?? DEFAULT_ESCUDO);
  const primary = escudo.primaryColor;
  const secondary = escudo.secondaryColor;
  const accent = escudo.accentColor ?? "#F57847";
  const pattern = escudo.pattern ?? "solid";
  const patternId = `kit-fill-${uid}`;
  const bodyFill = pattern === "solid" ? primary : `url(#${patternId})`;
  const numberLabel =
    number === null || number === undefined || number === ""
      ? null
      : String(number);

  return (
    <svg
      viewBox="0 0 80 90"
      width={size}
      height={Math.round(size * (90 / 80))}
      className={cn("shrink-0 drop-shadow-md", className)}
      aria-hidden
    >
      <defs>
        <KitPatternDefs
          id={patternId}
          pattern={pattern}
          primary={primary}
          secondary={secondary}
        />
      </defs>

      {/* Sleeves */}
      <path
        d="M8 28 L2 34 L8 48 L20 40 Z"
        fill={secondary}
        stroke={accent}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M72 28 L78 34 L72 48 L60 40 Z"
        fill={secondary}
        stroke={accent}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Body */}
      <path
        d="M20 22
           C24 14 30 12 34 14
           L40 8 L46 14
           C50 12 56 14 60 22
           L66 28
           L66 78
           Q66 84 58 84
           L22 84
           Q14 84 14 78
           L14 28 Z"
        fill={bodyFill}
        stroke={accent}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Collar */}
      <path
        d="M34 14 L40 22 L46 14"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M34 14 Q40 10 46 14"
        fill={secondary}
        stroke={accent}
        strokeWidth="1.2"
      />

      {/* Accent stripe */}
      <path
        d="M22 52 L58 52"
        stroke={accent}
        strokeWidth="3"
        opacity="0.85"
        strokeLinecap="round"
      />

      {numberLabel ? (
        <text
          x="40"
          y="46"
          textAnchor="middle"
          fill={accent}
          fontSize="16"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
          style={{ paintOrder: "stroke", stroke: primary, strokeWidth: 2 }}
        >
          {numberLabel.slice(0, 2)}
        </text>
      ) : null}
    </svg>
  );
}
