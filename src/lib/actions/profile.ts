"use server";

import { getUserClub } from "@/lib/actions/club";
import { getClubGameweekSummary } from "@/lib/actions/gameweek";
import { getGlobalRanking, getMyLeagues } from "@/lib/actions/leagues";
import { MAX_SQUAD } from "@/lib/game/squad-limits";
import type { EscudoConfig } from "@/lib/game/types";
import { getAuthUser } from "@/lib/queries/request-cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileSummary = {
  email: string;
  displayName: string;
  userId: string;
  club: {
    nombre: string;
    apodo: string | null;
    estilo: string | null;
    escudo_config: EscudoConfig;
    ciudad_ficticia: string | null;
    presupuesto: number;
    gemas: number;
  } | null;
  seasonPoints: number;
  gameweekPoints: number;
  gameweekRound: number | null;
  globalRank: number | null;
  globalTotal: number;
  leaguesCount: number;
  squadSize: number;
  maxSquad: number;
  gemas: number;
};

/** Solo lo que usa el shell (header + menú). Evita ranking/jornada en cada página. */
export async function getShellProfile(): Promise<ProfileSummary | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const club = await getUserClub();
  const email = user.email ?? "";
  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split("@")[0]?.toUpperCase() ||
    "MANAGER";

  return {
    email,
    displayName,
    userId: user.id.replace(/-/g, "").slice(0, 8).toUpperCase(),
    club: club
      ? {
          nombre: club.nombre,
          apodo: (club as { apodo?: string | null }).apodo ?? null,
          estilo: (club as { estilo?: string | null }).estilo ?? null,
          escudo_config: club.escudo_config as EscudoConfig,
          ciudad_ficticia: club.ciudad_ficticia,
          presupuesto: Number(club.presupuesto),
          gemas: Number(club.gemas ?? 150),
        }
      : null,
    seasonPoints: 0,
    gameweekPoints: 0,
    gameweekRound: null,
    globalRank: null,
    globalTotal: 0,
    leaguesCount: 0,
    squadSize: 0,
    maxSquad: MAX_SQUAD,
    gemas: club ? Number(club.gemas ?? 150) : 0,
  };
}

export async function getProfileSummary(): Promise<ProfileSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const club = await getUserClub();
  const gwSummary = await getClubGameweekSummary();
  const ranking = await getGlobalRanking();
  const leagues = await getMyLeagues();

  let squadSize = 0;
  if (club) {
    const { count } = await supabase
      .from("club_roster")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id);
    squadSize = count ?? 0;
  }

  const rankEntry = club
    ? ranking.find((r) => r.club_nombre === club.nombre)
    : undefined;

  const email = user.email ?? "";
  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split("@")[0]?.toUpperCase() ||
    "MANAGER";

  return {
    email,
    displayName,
    userId: user.id.replace(/-/g, "").slice(0, 8).toUpperCase(),
    club: club
      ? {
          nombre: club.nombre,
          apodo: (club as { apodo?: string | null }).apodo ?? null,
          estilo: (club as { estilo?: string | null }).estilo ?? null,
          escudo_config: club.escudo_config as EscudoConfig,
          ciudad_ficticia: club.ciudad_ficticia,
          presupuesto: Number(club.presupuesto),
          gemas: Number(club.gemas ?? 150),
        }
      : null,
    seasonPoints: gwSummary?.seasonPoints ?? rankEntry?.puntos ?? 0,
    gameweekPoints: gwSummary?.gameweekPoints ?? 0,
    gameweekRound: gwSummary?.gameweek?.round ?? null,
    globalRank: rankEntry?.posicion ?? null,
    globalTotal: ranking.length,
    leaguesCount: leagues.filter(Boolean).length,
    squadSize,
    maxSquad: MAX_SQUAD,
    gemas: club ? Number(club.gemas ?? 150) : 0,
  };
}
