import type { RNG } from "@/lib/game/rng";
import { createMathRng } from "@/lib/game/rng";
import { generateScoutingPlayer } from "@/lib/game/scouting";
import { MAX_SQUAD, SQUAD_POSITION_CAPS } from "@/lib/game/squad-limits";
import type { Player, PositionCounts, Rarity } from "@/lib/game/types";
import { RARITY_ORDER } from "@/lib/game/player-rarity";
import {
  rollWildCardFromPack,
  type WildCardPackTierId,
} from "@/lib/game/wild-card-packs";
import type { WildCardType } from "@/lib/game/wild-cards";

/** Gemas fijas por ganar el VS de jornada. */
export const VS_WIN_GEMS = 40;

/** Victorias seguidas para desbloquear el sobre especial. */
export const VS_STREAK_TARGET = 5;

export type VsOutcome = "win" | "loss" | "draw" | "no_rival";

export function resolveVsOutcome(
  myPoints: number,
  rivalPoints: number
): Exclude<VsOutcome, "no_rival"> {
  if (myPoints > rivalPoints) return "win";
  if (myPoints < rivalPoints) return "loss";
  return "draw";
}

export function nextVsWinStreak(
  currentStreak: number,
  outcome: VsOutcome
): number {
  if (outcome === "win") return currentStreak + 1;
  return 0;
}

export type RankingClub = { id: string; puntos: number; nombre?: string };

/** Same rule as inicio VS: club above you, or #2 if you are #1. */
export function resolveRivalClubId(
  ranked: RankingClub[],
  clubId: string
): string | null {
  const myIndex = ranked.findIndex((r) => r.id === clubId);
  if (myIndex < 0 || ranked.length < 2) return null;
  if (myIndex > 0) return ranked[myIndex - 1]?.id ?? null;
  return ranked[1]?.id ?? null;
}

export type VsStreakPackResult = {
  wildCardType: WildCardType;
  players: Player[];
};

/**
 * Sobre de racha: 1 Wild Card (pack oro) + 3 jugadores.
 * Uno de los tres está garantizado oro o leyenda.
 */
export function generateVsStreakPack(
  pool: Player[],
  rosterCounts: PositionCounts,
  scoutingNivel: number,
  rng: RNG = createMathRng(),
  wildCardTier: WildCardPackTierId = "oro"
): VsStreakPackResult {
  const wildCardType = rollWildCardFromPack(wildCardTier, rng);
  const counts = { ...rosterCounts };
  const players: Player[] = [];
  const used = new Set<string>();

  const guaranteed = pickGuaranteedGoldOrBetter(pool, counts, rng);
  if (guaranteed) {
    players.push(guaranteed);
    used.add(guaranteed.id);
    counts[guaranteed.posicion] += 1;
  }

  while (players.length < 3) {
    const size =
      counts.GK + counts.DEF + counts.MED + counts.DEL;
    if (size >= MAX_SQUAD) break;

    const filteredPool = pool.filter((p) => !used.has(p.id));
    const next = generateScoutingPlayer(
      filteredPool,
      counts,
      scoutingNivel,
      rng
    );
    if (!next) break;
    players.push(next);
    used.add(next.id);
    counts[next.posicion] += 1;
  }

  return { wildCardType, players };
}

function pickGuaranteedGoldOrBetter(
  pool: Player[],
  rosterCounts: PositionCounts,
  rng: RNG
): Player | null {
  const minIndex = RARITY_ORDER.indexOf("oro");
  const eligible = pool.filter(
    (p) =>
      RARITY_ORDER.indexOf(p.rareza as Rarity) >= minIndex &&
      rosterCounts[p.posicion] < SQUAD_POSITION_CAPS[p.posicion]
  );
  if (eligible.length === 0) return null;
  return eligible[Math.floor(rng.next() * eligible.length)] ?? null;
}
