import type { RNG } from "./rng";
import { createMathRng } from "./rng";
import {
  WILD_CARD_CATALOG,
  WILD_CARD_TYPES,
  type WildCardType,
} from "./wild-cards";

export const WILD_CARD_PACK_TIERS = [
  {
    id: "bronce",
    name: "Sobre Bronce",
    description: "Wild Card aleatoria del catálogo.",
    costGems: 40,
    color: "from-amber-700 to-amber-900",
  },
  {
    id: "oro",
    name: "Sobre Oro",
    description: "Mayor chance de cartas de jornada y Scout Dorado.",
    costGems: 120,
    color: "from-presi-gold to-amber-700",
  },
  {
    id: "leyenda",
    name: "Sobre Leyenda",
    description: "Garantiza Scout Dorado, Doble Jornada o Fichaje Libre.",
    costGems: 250,
    color: "from-violet-600 to-presi-navy",
  },
] as const;

export type WildCardPackTierId = (typeof WILD_CARD_PACK_TIERS)[number]["id"];

const LEGEND_POOL: WildCardType[] = [
  "golden_scout",
  "double_gameweek",
  "free_sign",
];

const ORO_BOOST_TYPES = new Set<WildCardType>([
  "golden_scout",
  "double_gameweek",
  "bench_boost",
  "contract_shield",
]);

function pickWeightedType(
  weights: Record<WildCardType, number>,
  rng: RNG
): WildCardType {
  const entries = WILD_CARD_TYPES.map((id) => ({
    id,
    weight: weights[id] ?? 0,
  })).filter((entry) => entry.weight > 0);

  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return "free_sign";

  let roll = rng.next() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1]?.id ?? "free_sign";
}

function baseWeights(): Record<WildCardType, number> {
  const weights = {} as Record<WildCardType, number>;
  for (const id of WILD_CARD_TYPES) {
    weights[id] = WILD_CARD_CATALOG[id].weight;
  }
  return weights;
}

export function rollWildCardFromPack(
  tierId: WildCardPackTierId,
  rng: RNG = createMathRng()
): WildCardType {
  if (tierId === "leyenda") {
    const index = Math.floor(rng.next() * LEGEND_POOL.length);
    return LEGEND_POOL[index] ?? "golden_scout";
  }

  const weights = baseWeights();

  if (tierId === "oro") {
    for (const id of WILD_CARD_TYPES) {
      if (ORO_BOOST_TYPES.has(id)) {
        weights[id] *= 2;
      }
    }
  }

  return pickWeightedType(weights, rng);
}

export function getWildCardPackTier(tierId: WildCardPackTierId) {
  return WILD_CARD_PACK_TIERS.find((tier) => tier.id === tierId) ?? null;
}
