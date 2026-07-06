export type GameweekPhase = "upcoming" | "live" | "finished";

export const GAMEWEEK_LIVE_BUFFER_MS = 3 * 60 * 60 * 1000;

export function deriveGameweekStatus(
  firstKickoffAt: string | Date,
  lastKickoffAt: string | Date | null | undefined,
  now: Date | number = Date.now()
): GameweekPhase {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const first = new Date(firstKickoffAt).getTime();
  const last = lastKickoffAt ? new Date(lastKickoffAt).getTime() : first;

  if (nowMs < first) return "upcoming";
  if (nowMs <= last + GAMEWEEK_LIVE_BUFFER_MS) return "live";
  return "finished";
}

export function gameweekPhaseLabel(phase: GameweekPhase): string {
  switch (phase) {
    case "upcoming":
      return "Próxima";
    case "live":
      return "En vivo";
    case "finished":
      return "Finalizada";
  }
}
