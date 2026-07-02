import type { EscudoConfig } from "@/lib/game/types";

const SHIELD_PATHS: Record<number, string> = {
  1: "M50 5 L90 20 L90 55 Q90 85 50 95 Q10 85 10 55 L10 20 Z",
  2: "M50 5 L90 20 L90 55 Q90 85 50 95 Q10 85 10 55 L10 20 Z",
  3: "M50 8 Q85 8 88 45 Q85 88 50 92 Q15 88 12 45 Q15 8 50 8 Z",
  4: "M50 8 Q85 8 88 45 Q85 88 50 92 Q15 88 12 45 Q15 8 50 8 Z",
  5: "M50 5 L85 25 L75 80 L50 95 L25 80 L15 25 Z",
  6: "M50 5 L85 25 L75 80 L50 95 L25 80 L15 25 Z",
  7: "M15 25 L85 25 L90 55 L50 95 L10 55 Z",
  8: "M15 25 L85 25 L90 55 L50 95 L10 55 Z",
};

function renderIcon(templateId: number, color: string) {
  switch (templateId) {
    case 1:
      return <circle cx="50" cy="52" r="16" fill={color} />;
    case 2:
      return (
        <path
          d="M50 35 L62 55 L50 70 L38 55 Z M50 30 L70 55 L50 78 L30 55 Z"
          fill={color}
        />
      );
    case 3:
      return (
        <polygon
          points="50,35 58,55 50,68 42,55"
          fill={color}
        />
      );
    case 4:
      return <rect x="40" y="38" width="20" height="30" fill={color} />;
    case 5:
      return (
        <path d="M50 32 L55 52 L50 72 L45 52 Z" fill={color} />
      );
    case 6:
      return <ellipse cx="50" cy="55" rx="12" ry="16" fill={color} />;
    case 7:
      return (
        <path d="M30 65 L50 38 L70 65 Z" fill={color} />
      );
    case 8:
      return <circle cx="50" cy="48" r="14" fill={color} />;
    default:
      return <circle cx="50" cy="52" r="16" fill={color} />;
  }
}

export function EscudoRenderer({
  config,
  size = 80,
  className,
}: {
  config: EscudoConfig;
  size?: number;
  className?: string;
}) {
  const path = SHIELD_PATHS[config.templateId] ?? SHIELD_PATHS[1];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <path d={path} fill={config.primaryColor} stroke={config.secondaryColor} strokeWidth="3" />
      {renderIcon(config.templateId, config.secondaryColor)}
    </svg>
  );
}

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
