type GameweekLike = {
  firstKickoffAt: string;
  status: string;
};

/** Abierta hasta el primer pitido; cerrada solo si la jornada en curso ya empezó y no hay próxima. */
export function computeIsLineupLocked(
  editingGameweek: GameweekLike | null,
  currentGameweek: GameweekLike | null,
  now: Date = new Date()
): boolean {
  if (editingGameweek) {
    return now.getTime() >= new Date(editingGameweek.firstKickoffAt).getTime();
  }

  if (
    currentGameweek?.status === "live" ||
    currentGameweek?.status === "finished"
  ) {
    return true;
  }

  return false;
}
