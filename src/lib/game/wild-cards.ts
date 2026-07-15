import type { RNG } from "./rng";
import { createMathRng } from "./rng";
import {
  getHinchasWildCardBonusPct,
} from "./facility-effects";
import { SQUAD_POSITION_CAPS } from "./squad-limits";
import type { Player, PositionCounts, Rarity } from "./types";
import { generateScoutingPlayer } from "./scouting";

export const WILD_CARD_TYPES = [
  "free_sign",
  "bench_boost",
  "contract_shield",
  "free_renewal",
  "golden_scout",
  "double_gameweek",
] as const;

export type WildCardType = (typeof WILD_CARD_TYPES)[number];

export type WildCardKind = "instant" | "gameweek";

export interface WildCardDefinition {
  id: WildCardType;
  name: string;
  description: string;
  kind: WildCardKind;
  color: string;
  icon: string;
  weight: number;
}

export const WILD_CARD_CATALOG: Record<WildCardType, WildCardDefinition> = {
  free_sign: {
    id: "free_sign",
    name: "Comodín Fichaje",
    description:
      "Ficha 1 jugador del pool sin costo de presupuesto (respeta caps de plantilla).",
    kind: "instant",
    color: "from-presi-gold to-presi-navy",
    icon: "📝",
    weight: 20,
  },
  bench_boost: {
    id: "bench_boost",
    name: "Banca Extra",
    description:
      "Los 5 de banca también suman puntos en la jornada activa (además del 11 y auto-subs).",
    kind: "gameweek",
    color: "from-violet-500 to-purple-800",
    icon: "🪑",
    weight: 18,
  },
  contract_shield: {
    id: "contract_shield",
    name: "Contrato Blindado",
    description:
      "La línea efectiva no consume contrato en la jornada activa.",
    kind: "gameweek",
    color: "from-amber-400 to-orange-700",
    icon: "🛡️",
    weight: 18,
  },
  free_renewal: {
    id: "free_renewal",
    name: "Renovación Express",
    description: "Renueva gratis el contrato de 1 jugador de tu plantilla.",
    kind: "instant",
    color: "from-sky-400 to-blue-800",
    icon: "🔄",
    weight: 18,
  },
  golden_scout: {
    id: "golden_scout",
    name: "Ojo de Águila",
    description:
      "El próximo sobre de scouting garantiza jugador Oro o Leyenda.",
    kind: "instant",
    color: "from-yellow-400 to-amber-700",
    icon: "🦅",
    weight: 16,
  },
  double_gameweek: {
    id: "double_gameweek",
    name: "Puntos Doble",
    description: "Los puntos de tu club en la jornada activa se duplican.",
    kind: "gameweek",
    color: "from-presi-maroon to-presi-navy-deep",
    icon: "✖️2",
    weight: 10,
  },
};

export const MAX_WILD_CARD_INVENTORY = 6;

export type ScoutingReward =
  | { kind: "player"; player: Player }
  | { kind: "wild_card"; cardType: WildCardType };

export interface GameweekWildCardEffects {
  benchBoost: boolean;
  contractShield: boolean;
  doubleGameweek: boolean;
}

export const BASE_WILD_CARD_CHANCE = 0.09;

export function getWildCardChance(hinchasNivel: number): number {
  const bonus = getHinchasWildCardBonusPct(hinchasNivel) / 100;
  return Math.min(BASE_WILD_CARD_CHANCE + bonus, 0.25);
}

export function canClaimWildCard(
  availableCardTypes: WildCardType[],
  cardType: WildCardType
): { ok: true } | { ok: false; reason: string } {
  if (availableCardTypes.length >= MAX_WILD_CARD_INVENTORY) {
    return {
      ok: false,
      reason:
        "Inventario lleno (máx. 6 cartas, una de cada tipo). Usa una carta antes de reclamar.",
    };
  }

  if (availableCardTypes.includes(cardType)) {
    return {
      ok: false,
      reason: "Ya tienes esa carta en el inventario. Actívala o rechaza este sobre.",
    };
  }

  return { ok: true };
}

export function getWildCardDefinition(
  cardType: WildCardType
): WildCardDefinition {
  return WILD_CARD_CATALOG[cardType];
}

function pickWildCardType(rng: RNG): WildCardType {
  const entries = WILD_CARD_TYPES.map((id) => ({
    id,
    weight: WILD_CARD_CATALOG[id].weight,
  }));
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng.next() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return "free_sign";
}

export function rollScoutingRewardKind(
  hinchasNivel: number,
  rng: RNG = createMathRng()
): "player" | "wild_card" {
  return rng.next() < getWildCardChance(hinchasNivel) ? "wild_card" : "player";
}

export function rollWildCardType(rng: RNG = createMathRng()): WildCardType {
  return pickWildCardType(rng);
}

export function generateScoutingReward(
  pool: Player[],
  rosterCounts: PositionCounts,
  scoutingNivel: number,
  rng: RNG = createMathRng(),
  options?: { minRarity?: Rarity | null; hinchasNivel?: number }
): ScoutingReward | null {
  const hinchasNivel = options?.hinchasNivel ?? 1;
  const rewardKind = rollScoutingRewardKind(hinchasNivel, rng);

  if (rewardKind === "wild_card") {
    return { kind: "wild_card", cardType: rollWildCardType(rng) };
  }

  let player = generateScoutingPlayer(pool, rosterCounts, scoutingNivel, rng);

  if (options?.minRarity === "oro" || options?.minRarity === "leyenda") {
    const min = options.minRarity;
    const order: Rarity[] = ["bronce", "plata", "oro", "leyenda"];
    const minIndex = order.indexOf(min);
    const eligible = pool.filter(
      (p) =>
        order.indexOf(p.rareza) >= minIndex &&
        rosterCounts[p.posicion] < SQUAD_POSITION_CAPS[p.posicion]
    );
    if (eligible.length > 0) {
      player = eligible[Math.floor(rng.next() * eligible.length)];
    }
  }

  if (!player) return null;
  return { kind: "player", player };
}

export function canActivateWildCard(
  cardType: WildCardType,
  gameweekStatus: string | null,
  activeGameweekCards: WildCardType[]
): { ok: true } | { ok: false; reason: string } {
  const def = WILD_CARD_CATALOG[cardType];

  if (def.kind === "gameweek") {
    if (!gameweekStatus || !["upcoming", "live"].includes(gameweekStatus)) {
      return {
        ok: false,
        reason: "Esta carta solo se puede usar con una jornada activa o próxima.",
      };
    }
    if (activeGameweekCards.length > 0) {
      return {
        ok: false,
        reason: "Ya tienes una carta de jornada activa. Solo una por jornada.",
      };
    }
  }

  return { ok: true };
}

export function emptyGameweekEffects(): GameweekWildCardEffects {
  return {
    benchBoost: false,
    contractShield: false,
    doubleGameweek: false,
  };
}

export function effectsFromActiveCards(
  cardTypes: WildCardType[]
): GameweekWildCardEffects {
  return {
    benchBoost: cardTypes.includes("bench_boost"),
    contractShield: cardTypes.includes("contract_shield"),
    doubleGameweek: cardTypes.includes("double_gameweek"),
  };
}
