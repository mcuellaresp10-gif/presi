const BASE_URL = "https://v3.football.api-sports.io";

export const DEFAULT_LEAGUE_ID = 239;
export const DEFAULT_SEASON = new Date().getFullYear();

export function isApiFootballConfigured(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY?.trim());
}

async function apiFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not configured");

  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": key },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`API-Football error ${res.status}: ${path}`);
  }

  const json = (await res.json()) as { response: T };
  return json.response;
}

export type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: { round: string; season: number };
  goals: { home: number | null; away: number | null };
  teams: {
    home: { name: string };
    away: { name: string };
  };
};

export type ApiPlayerStats = {
  player: { id: number; name: string };
  statistics: Array<{
    games: {
      minutes: number | null;
      position: string | null;
      substitute?: boolean | null;
    };
    goals: {
      total: number | null;
      assists: number | null;
      conceded?: number | null;
      saves?: number | null;
    };
    passes?: {
      total: number | null;
      key?: number | null;
      accuracy?: string | number | null;
    };
    tackles?: { total?: number | null };
    duels?: { total?: number | null; won?: number | null };
    dribbles?: { success?: number | null };
    fouls?: { drawn?: number | null; committed?: number | null };
    cards: { yellow: number | null; red: number | null };
    team?: { name: string };
  }>;
};

export async function fetchLeagueFixtures(
  leagueId = DEFAULT_LEAGUE_ID,
  season = DEFAULT_SEASON
): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>("/fixtures", {
    league: String(leagueId),
    season: String(season),
  });
}

export async function fetchFixturePlayerStats(
  fixtureId: number
): Promise<ApiPlayerStats[]> {
  return apiFetch<ApiPlayerStats[]>("/fixtures/players", {
    fixture: String(fixtureId),
  });
}

export async function fetchLeaguePlayers(
  leagueId = DEFAULT_LEAGUE_ID,
  season = DEFAULT_SEASON,
  page = 1
): Promise<ApiLeaguePlayerRow[]> {
  const result = await fetchLeaguePlayersPage(leagueId, season, page);
  return result.players;
}

export type ApiLeaguePlayerRow = {
  player: { id: number; name: string; photo: string | null };
  statistics: Array<{
    league?: { id?: number | null } | null;
    games?: {
      minutes?: number | null;
      appearences?: number | null;
      position?: string | null;
    } | null;
    goals?: {
      total?: number | null;
      assists?: number | null;
      conceded?: number | null;
      saves?: number | null;
    } | null;
    passes?: { key?: number | null } | null;
    tackles?: { total?: number | null } | null;
    duels?: { won?: number | null } | null;
    team?: { name?: string | null } | null;
  }>;
};

export async function fetchLeaguePlayersPage(
  leagueId = DEFAULT_LEAGUE_ID,
  season = DEFAULT_SEASON,
  page = 1
): Promise<{
  players: ApiLeaguePlayerRow[];
  paging: { current: number; total: number };
}> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not configured");

  const url = new URL(`${BASE_URL}/players`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": key },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`API-Football error ${res.status}: /players`);
  }

  const json = (await res.json()) as {
    response: ApiLeaguePlayerRow[];
    paging?: { current?: number; total?: number };
  };

  return {
    players: json.response ?? [],
    paging: {
      current: json.paging?.current ?? page,
      total: json.paging?.total ?? page,
    },
  };
}

export function parseRoundNumber(round: string): number {
  const match = round.match(/(\d+)/);
  return match ? Number(match[1]) : 1;
}

export function mapApiPosition(pos: string | null): "GK" | "DEF" | "MED" | "DEL" {
  const p = (pos ?? "").toUpperCase();
  if (p === "G" || p.includes("GOAL")) return "GK";
  if (p === "D" || p.includes("DEF")) return "DEF";
  if (p === "M" || p.includes("MID")) return "MED";
  return "DEL";
}
