/**
 * Player-facing rules for PRESI (Spanish).
 * Keep aligned with docs/SCORING.md, SPRINT2_DESIGN.md, FACILITIES.md, WILD_CARDS.md
 * and the live scoring / facility / wild-card engines.
 */

export type HelpSectionId =
  | "objetivo"
  | "plantilla"
  | "puntuacion"
  | "contratos"
  | "instalaciones"
  | "scouting"
  | "wild-cards"
  | "tienda"
  | "ligas";

export type HelpBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "note"; text: string };

export type HelpSection = {
  id: HelpSectionId;
  title: string;
  /** Short copy for tour steps and HelpTip sheets */
  summary: string;
  body: HelpBlock[];
};

/** Scoring table mirrors GOAL_POINTS / rules in scoring-rules.ts */
export const SCORING_TABLE_HEADERS = ["Acción", "GK", "DEF", "MED", "DEL"];

export const SCORING_TABLE_ROWS: string[][] = [
  ["Gol", "10", "12", "10", "8"],
  ["Asistencia", "8", "8", "8", "8"],
  ["Titular", "+3", "+3", "+3", "+3"],
  ["Victoria equipo (≥55 min)", "+5", "+5", "+5", "+5"],
  ["Empate equipo (≥55 min)", "+1", "+1", "+1", "+1"],
  ["Parada (GK)", "+1 c/u", "—", "—", "—"],
  ["60+ pases precisos", "—", "+3", "+3", "+3"],
  ["90+ pases precisos", "—", "+6", "+6", "+6"],
  ["Tackle ganado", "+1", "+1", "+1", "+2"],
  ["Pase clave", "+1", "+1", "+1", "+1"],
  ["Regate exitoso", "+1", "+1", "+1", "+1"],
  ["Gran ocasión creada", "—", "—", "+2", "+2"],
  ["Falta recibida", "+1", "+1", "+1", "+1"],
  ["Duelo aéreo ganado", "—", "+1/4", "+1/4", "+1/2"],
  ["Duelo aéreo perdido", "—", "−1/2", "−1/2", "−1/2"],
  ["Falta cometida", "−1", "−1", "−1", "−1"],
  ["Amarilla", "−2", "−2", "−2", "−2"],
  ["Roja", "−8", "−8", "−8", "−8"],
  ["GC extra (GK/DEF, ≥2 y ≥55 min)", "−2", "−2", "—", "—"],
];

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "objetivo",
    title: "Cómo se juega",
    summary:
      "Eres el presidente de tu club: arma plantilla, suma puntos con la Liga Colombiana real y compite en ligas privadas.",
    body: [
      {
        type: "p",
        text: "PRESI es fantasy ownership de fútbol colombiano. Creas tu club, fichas jugadores reales y compites por puntos de cada jornada de la Liga.",
      },
      {
        type: "ul",
        items: [
          "Arma 11 titulares + 5 de banca antes del primer partido de la jornada.",
          "Los puntos salen de las estadísticas reales de los partidos.",
          "Mejora instalaciones, haz scouting y usa Wild Cards para potenciar tu club.",
          "Compite en ligas privadas y en el ranking global.",
        ],
      },
    ],
  },
  {
    id: "plantilla",
    title: "Plantilla y alineación",
    summary:
      "Arma 11 + banca de 5 antes del deadline. Si te falta alguien, ese hueco no suma; el resto de tu alineación sí. El capitán duplica sus puntos.",
    body: [
      {
        type: "p",
        text: "Tu plantilla tiene hasta 24 jugadores: 11 titulares, 5 en banca (orden 1→5) y hasta 8 en reserva.",
      },
      {
        type: "ul",
        items: [
          "Caps por posición: GK 3 · DEF 8 · MED 8 · DEL 7.",
          "Elige un capitán: sus puntos de la jornada se duplican (×2).",
          "Guarda la alineación antes del primer partido. Al pitido queda bloqueada.",
          "Si el deadline llega incompleto: solo suman los jugadores que sí pusiste; los huecos vacíos no aportan puntos.",
        ],
      },
      {
        type: "p",
        text: "Auto-sustitución: si un titular no juega (0 minutos), entra el primer suplente de la misma posición en orden de banca. La reserva nunca entra sola.",
      },
      {
        type: "note",
        text: "En Plantilla puedes arrastrar jugadores o tocar una carta para moverla entre titular, banca y reserva.",
      },
    ],
  },
  {
    id: "puntuacion",
    title: "Puntuación",
    summary:
      "Los puntos siguen un sistema tipo FIFA Fantasy por posición. El capitán ×2; el cuerpo médico reduce penalizaciones.",
    body: [
      {
        type: "p",
        text: "Cada acción vale distinto según la posición. Goles valen más en defensa; tackles y duelos aéreos más en delantera.",
      },
      {
        type: "table",
        headers: SCORING_TABLE_HEADERS,
        rows: SCORING_TABLE_ROWS,
      },
      {
        type: "ul",
        items: [
          "Sin minutos (< 1): 0 puntos.",
          "Capitán: duplica el total del jugador.",
          "Cuerpo médico: reduce solo líneas negativas (tarjetas, faltas, GC extra, duelos perdidos), hasta 75 %.",
          "Milestones de pases (60+/90+) se evalúan sobre el total de la jornada.",
        ],
      },
    ],
  },
  {
    id: "contratos",
    title: "Contratos",
    summary:
      "Los jugadores de la línea efectiva consumen jornada de contrato. Renueva a tiempo o pierdes fichas.",
    body: [
      {
        type: "ul",
        items: [
          "Cada jornada, los jugadores que entran en la línea efectiva (titulares y auto-subs) consumen contrato.",
          "Puedes renovar contratos desde la ficha del jugador (con costo, salvo Wild Card).",
          "En Inicio verás un aviso si tienes contratos por vencer pronto.",
        ],
      },
    ],
  },
  {
    id: "instalaciones",
    title: "Instalaciones",
    summary:
      "Mejora el campus (niveles 1–10) para ingresos, scouting, descuentos y bonos. Máximo 2 mejoras a la vez.",
    body: [
      {
        type: "p",
        text: "Cada edificio sube de nivel 1 a 10. Mejorar cuesta presupuesto y tarda un timer de construcción.",
      },
      {
        type: "ul",
        items: [
          "Hinchas + Oficina: ingresos pasivos (cobro en Inicio o Instalaciones).",
          "Scouting: timer y rareza de sobres.",
          "Academia: promesas juveniles.",
          "Cuerpo médico: menos penalizaciones en puntos.",
          "Gimnasio: bonus de puntos en ligas y ranking.",
          "Máximo 2 mejoras simultáneas.",
        ],
      },
    ],
  },
  {
    id: "scouting",
    title: "Scouting",
    summary:
      "El Centro de Scouting genera sobres con timer. Sube el nivel para más oro/leyenda y mejor chance de Wild Card.",
    body: [
      {
        type: "ul",
        items: [
          "Cuando el timer termina, abre el sobre: jugador o Wild Card.",
          "Puedes reclamar o rechazar; al rechazar arranca el próximo timer.",
          "Nivel de scouting: menos espera y más chance de rarezas altas.",
          "Hinchas suben la probabilidad base de Wild Card (9 % + bonus por nivel).",
        ],
      },
      {
        type: "note",
        text: "La barra «Descubre tu próximo jugador» en Inicio te lleva al scouting cuando está listo.",
      },
    ],
  },
  {
    id: "wild-cards",
    title: "Wild Cards",
    summary:
      "Cartas especiales del scouting (o tienda). Inventario máx. 6 (una por tipo). Solo 1 carta de jornada activa.",
    body: [
      {
        type: "ul",
        items: [
          "Comodín Fichaje — ficha 1 jugador sin costo (respeta caps).",
          "Banca Extra — los 5 de banca también suman puntos.",
          "Contrato Blindado — la línea efectiva no consume contrato.",
          "Renovación Express — renueva gratis 1 jugador.",
          "Ojo de Águila — próximo scouting Oro o Leyenda.",
          "Puntos Doble — puntos de la jornada ×2.",
        ],
      },
      {
        type: "p",
        text: "Cartas instantáneas se usan al activar. Cartas de jornada solo con jornada upcoming o live. Al terminar la jornada, las activas pasan a usadas.",
      },
    ],
  },
  {
    id: "tienda",
    title: "Tienda",
    summary:
      "Gasta gemas en préstamos temporales y sobres de Wild Cards. Hay límite de préstamos activos.",
    body: [
      {
        type: "ul",
        items: [
          "Mercado de préstamos: ofertas que se refrescan; el jugador llega por varias jornadas.",
          "Sobres Wild Card: compra chance de cartas especiales con gemas.",
          "Respeta el máximo de préstamos activos y el espacio de inventario de Wild Cards.",
        ],
      },
    ],
  },
  {
    id: "ligas",
    title: "Ligas y ranking",
    summary:
      "Crea o únete a ligas privadas con amigos. El ranking global ordena clubs por puntos de temporada.",
    body: [
      {
        type: "ul",
        items: [
          "Mis ligas: crea una liga o únete con código.",
          "Ranking global: posición de tu club por puntos de temporada.",
          "El gimnasio puede dar un bonus porcentual a puntos en ligas y ranking.",
        ],
      },
    ],
  },
];

export const HELP_SECTION_BY_ID: Record<HelpSectionId, HelpSection> =
  Object.fromEntries(HELP_SECTIONS.map((s) => [s.id, s])) as Record<
    HelpSectionId,
    HelpSection
  >;

/** Tour step order (summaries only). */
export const HOWTO_TOUR_STEPS: HelpSectionId[] = [
  "objetivo",
  "plantilla",
  "puntuacion",
  "instalaciones",
  "scouting",
  "wild-cards",
];

export function getHelpSection(id: HelpSectionId): HelpSection {
  return HELP_SECTION_BY_ID[id];
}

export function isHelpSectionId(value: string): value is HelpSectionId {
  return value in HELP_SECTION_BY_ID;
}
