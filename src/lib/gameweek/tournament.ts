import type { ApiFixture } from "@/lib/api-football/client";

export type TournamentPhase = "apertura" | "clausura";

export type GameweekFixtureGroup = {
  phase: TournamentPhase;
  round: number;
  fixtures: ApiFixture[];
};

export function inferTournamentPhaseFromDate(iso: string | Date): TournamentPhase {
  const month = new Date(iso).getMonth() + 1;
  return month >= 7 ? "clausura" : "apertura";
}

/** Semestre activo del juego (Clausura = jul–dic en Colombia). */
export function getActiveTournamentPhase(now: Date = new Date()): TournamentPhase {
  const env = process.env.API_FOOTBALL_TOURNAMENT_PHASE?.toLowerCase();
  if (env === "apertura" || env === "clausura") return env;
  return now.getMonth() + 1 >= 7 ? "clausura" : "apertura";
}

export function tournamentPhaseLabel(phase: TournamentPhase): string {
  return phase === "clausura" ? "Clausura" : "Apertura";
}

export function parseFixtureTournamentPhase(
  roundLabel: string,
  kickoffAt: string
): TournamentPhase {
  const normalized = roundLabel.toLowerCase();
  if (normalized.includes("clausura")) return "clausura";
  if (normalized.includes("apertura")) return "apertura";
  return inferTournamentPhaseFromDate(kickoffAt);
}

export function gameweekGroupKey(
  phase: TournamentPhase,
  round: number
): string {
  return `${phase}:${round}`;
}

/**
 * Agrupa fixtures por semestre y renumerar jornadas 1..N por fecha.
 * La API suele devolver "Regular Season - 20" acumulado; en Clausura la fecha 1 debe ser J1.
 */
export function buildGameweekGroupsFromFixtures(
  fixtures: ApiFixture[]
): GameweekFixtureGroup[] {
  const byPhase = new Map<TournamentPhase, ApiFixture[]>();

  for (const fixture of fixtures) {
    const phase = parseFixtureTournamentPhase(
      fixture.league.round,
      fixture.fixture.date
    );
    const list = byPhase.get(phase) ?? [];
    list.push(fixture);
    byPhase.set(phase, list);
  }

  const groups: GameweekFixtureGroup[] = [];

  for (const [phase, phaseFixtures] of byPhase) {
    const byApiRound = new Map<string, ApiFixture[]>();
    for (const f of phaseFixtures) {
      const label = f.league.round;
      const bucket = byApiRound.get(label) ?? [];
      bucket.push(f);
      byApiRound.set(label, bucket);
    }

    const sortedRoundBuckets = Array.from(byApiRound.values()).sort((a, b) => {
      const aMin = Math.min(
        ...a.map((f) => new Date(f.fixture.date).getTime())
      );
      const bMin = Math.min(
        ...b.map((f) => new Date(f.fixture.date).getTime())
      );
      return aMin - bMin;
    });

    sortedRoundBuckets.forEach((roundFixtures, index) => {
      groups.push({
        phase,
        round: index + 1,
        fixtures: roundFixtures,
      });
    });
  }

  return groups;
}
