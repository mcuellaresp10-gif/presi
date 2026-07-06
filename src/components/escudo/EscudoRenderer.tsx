import { normalizeEscudoConfig } from "@/lib/game/escudo-sanitize";
import { ESCUDO_TEMPLATES } from "@/lib/game/escudo-presets";
import type { EscudoConfig, EscudoPattern } from "@/lib/game/types";

export { ESCUDO_TEMPLATES };

const SHIELD_PATHS: Record<number, string> = {
  1: "M50 5 L90 20 L90 55 Q90 85 50 95 Q10 85 10 55 L10 20 Z",
  2: "M50 8 Q85 8 88 45 Q85 88 50 92 Q15 88 12 45 Q15 8 50 8 Z",
  3: "M50 5 L85 25 L75 80 L50 95 L25 80 L15 25 Z",
  4: "M15 25 L85 25 L90 55 L50 95 L10 55 Z",
  5: "M50 4 L88 18 L82 58 L50 96 L18 58 L12 18 Z",
  6: "M50 10 A38 38 0 1 1 49.99 10 Z",
};

function patternId(shapeId: number, pattern: EscudoPattern) {
  return `escudo-pattern-${shapeId}-${pattern}`;
}

function PatternDefs({
  shapeId,
  pattern,
  primary,
  secondary,
}: {
  shapeId: number;
  pattern: EscudoPattern;
  primary: string;
  secondary: string;
}) {
  if (pattern === "solid") return null;

  const id = patternId(shapeId, pattern);

  if (pattern === "vertical") {
    return (
      <pattern id={id} width="12" height="100" patternUnits="userSpaceOnUse">
        <rect width="6" height="100" fill={primary} />
        <rect x="6" width="6" height="100" fill={secondary} opacity="0.35" />
      </pattern>
    );
  }

  if (pattern === "horizontal") {
    return (
      <pattern id={id} width="100" height="12" patternUnits="userSpaceOnUse">
        <rect width="100" height="6" fill={primary} />
        <rect y="6" width="100" height="6" fill={secondary} opacity="0.35" />
      </pattern>
    );
  }

  return (
    <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill={primary} />
      <path d="M0 14 L14 0" stroke={secondary} strokeWidth="4" opacity="0.4" />
    </pattern>
  );
}

function renderIcon(iconId: number, color: string, accent: string) {
  switch (iconId) {
    case 1:
      return (
        <>
          <circle cx="50" cy="52" r="17" fill={color} />
          <path
            d="M50 36 L58 52 L50 68 L42 52 Z"
            fill={accent}
            opacity="0.85"
          />
        </>
      );
    case 2:
      return (
        <path
          d="M50 30 L68 52 L58 72 L42 72 L32 52 Z M50 34 L64 52 L50 68 L36 52 Z"
          fill={color}
        />
      );
    case 3:
      return (
        <polygon
          points="50,32 58,52 50,70 42,52"
          fill={color}
          stroke={accent}
          strokeWidth="2"
        />
      );
    case 4:
      return (
        <>
          <rect x="38" y="36" width="24" height="32" rx="2" fill={color} />
          <rect x="44" y="42" width="5" height="5" fill={accent} />
          <rect x="51" y="42" width="5" height="5" fill={accent} />
        </>
      );
    case 5:
      return <path d="M50 30 L56 52 L50 74 L44 52 Z" fill={color} />;
    case 6:
      return (
        <>
          <ellipse cx="50" cy="56" rx="14" ry="17" fill={color} />
          <path d="M42 48 Q50 42 58 48" stroke={accent} strokeWidth="2" fill="none" />
        </>
      );
    case 7:
      return (
        <path
          d="M28 66 L50 36 L72 66 Z"
          fill={color}
          stroke={accent}
          strokeWidth="2"
        />
      );
    case 8:
      return (
        <>
          <circle cx="50" cy="48" r="15" fill={color} />
          <circle cx="50" cy="48" r="8" fill={accent} opacity="0.9" />
        </>
      );
    case 9:
      return (
        <path
          d="M50 30 Q62 45 58 68 L50 62 L42 68 Q38 45 50 30 M50 62 L50 74"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    case 10:
      return (
        <path
          d="M34 68 Q34 48 50 40 Q66 48 66 68 M42 58 L46 52 M54 52 L58 58"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    case 11:
      return (
        <path
          d="M30 58 Q50 28 70 58 L62 68 L38 68 Z"
          fill={color}
          stroke={accent}
          strokeWidth="2"
        />
      );
    case 12:
      return (
        <path
          d="M34 58 L38 48 L42 54 L50 42 L58 54 L62 48 L66 58 Z"
          fill={color}
          stroke={accent}
          strokeWidth="2"
        />
      );
    default:
      return <circle cx="50" cy="52" r="16" fill={color} />;
  }
}

export function EscudoRenderer({
  config: rawConfig,
  size = 80,
  className,
}: {
  config: EscudoConfig;
  size?: number;
  className?: string;
}) {
  const config = normalizeEscudoConfig(rawConfig);
  const path = SHIELD_PATHS[config.shapeId] ?? SHIELD_PATHS[1]!;
  const pattern = config.pattern ?? "solid";
  const fill =
    pattern === "solid"
      ? config.primaryColor
      : `url(#${patternId(config.shapeId, pattern)})`;
  const accent = config.accentColor ?? config.secondaryColor;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <defs>
        <PatternDefs
          shapeId={config.shapeId}
          pattern={pattern}
          primary={config.primaryColor}
          secondary={config.secondaryColor}
        />
        <clipPath id={`escudo-clip-${config.shapeId}`}>
          <path d={path} />
        </clipPath>
      </defs>
      <path
        d={path}
        fill={fill}
        stroke={config.secondaryColor}
        strokeWidth="3.5"
      />
      <path
        d={path}
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        opacity="0.45"
        transform="scale(0.88) translate(6 6)"
      />
      <g clipPath={`url(#escudo-clip-${config.shapeId})`}>
        {renderIcon(config.iconId, config.secondaryColor, accent)}
      </g>
    </svg>
  );
}
