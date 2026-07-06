export type TournamentPhase = "apertura" | "clausura";

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
