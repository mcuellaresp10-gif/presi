const DATE_FMT = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const TIME_FMT = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
});

const DATE_TIME_FMT = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function formatFixtureKickoff(iso: string): string {
  const date = new Date(iso);
  return DATE_TIME_FMT.format(date);
}

export function formatGameweekRange(
  firstKickoffAt: string,
  lastKickoffAt: string | null
): string {
  const first = new Date(firstKickoffAt);
  const last = lastKickoffAt ? new Date(lastKickoffAt) : first;

  if (first.toDateString() === last.toDateString()) {
    return `${DATE_FMT.format(first)} · ${TIME_FMT.format(first)}`;
  }

  return `${DATE_FMT.format(first)} – ${DATE_FMT.format(last)}`;
}

export function isFixtureFinished(status: string): boolean {
  return ["FT", "AET", "PEN", "AWD", "WO"].includes(status);
}

export function isFixtureLive(status: string): boolean {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"].includes(status);
}
