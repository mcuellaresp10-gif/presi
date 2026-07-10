"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { getUserClub } from "@/lib/actions/club";
import { getGymLeagueBonusForClub } from "@/lib/actions/facilities";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { generateInviteCode } from "@/lib/utils";

export async function createPrivateLeague(nombre: string) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const trimmed = nombre.trim();
  if (trimmed.length < 3) {
    return { error: "El nombre debe tener al menos 3 caracteres." };
  }

  const codigo = generateInviteCode();

  const { data: league, error } = await supabase
    .from("leagues")
    .insert({
      nombre: trimmed,
      tipo: "privada",
      codigo_invitacion: codigo,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("league_memberships").insert({
    league_id: league.id,
    club_id: club.id,
  });

  revalidatePath("/ligas");
  return { success: true, league, inviteCode: codigo };
}

export async function joinLeagueByCode(codigo: string) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("codigo_invitacion", codigo.toUpperCase())
    .eq("tipo", "privada")
    .maybeSingle();

  if (!league) return { error: "Código de invitación inválido." };

  const { data: existing } = await supabase
    .from("league_memberships")
    .select("*")
    .eq("league_id", league.id)
    .eq("club_id", club.id)
    .maybeSingle();

  if (existing) return { error: "Ya estás en esta liga." };

  const { error } = await supabase.from("league_memberships").insert({
    league_id: league.id,
    club_id: club.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/ligas");
  return { success: true, league };
}

export async function getMyLeagues() {
  const club = await getUserClub();
  if (!club) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("league_memberships")
    .select("league_id, leagues(*)")
    .eq("club_id", club.id);

  return (data ?? []).map((row) => row.leagues);
}

export const getGlobalRanking = cache(async function getGlobalRanking() {
  const supabase = await createClient();
  const club = await getUserClub();
  const season = new Date().getFullYear();

  // Prefer service role so ranking includes every active club even if RLS
  // on nested joins is restrictive in older environments.
  let reader = supabase;
  try {
    reader = createServiceRoleClient();
  } catch {
    // Fall back to user client (works once ranking RLS / view is applied).
  }

  const [{ data: clubs }, { data: pointsRows }] = await Promise.all([
    reader
      .from("clubs")
      .select("id, nombre, escudo_config")
      .eq("onboarding_completado", true),
    reader
      .from("club_season_points")
      .select("club_id, total_points")
      .eq("season", season),
  ]);

  // Fallback to public view if clubs table still hides other rows.
  let activeClubs = clubs ?? [];
  if (activeClubs.length <= 1) {
    const { data: publicClubs, error: viewError } = await reader
      .from("clubs_public_ranking")
      .select("id, nombre, escudo_config");
    if (
      !viewError &&
      publicClubs &&
      publicClubs.length > activeClubs.length
    ) {
      activeClubs = publicClubs;
    }
  }

  const pointsByClub = new Map<string, number>();
  for (const row of pointsRows ?? []) {
    pointsByClub.set(row.club_id as string, Number(row.total_points) || 0);
  }

  const userBonusPct = club ? await getGymLeagueBonusForClub(club.id) : 0;

  const ranked = activeClubs
    .map((row) => {
      const basePoints = pointsByClub.get(row.id) ?? 0;
      const isUser = club?.id === row.id;
      return {
        id: row.id,
        club_nombre: row.nombre as string,
        escudo_config: row.escudo_config,
        /** Season points obtained (gym % shown separately for the viewer). */
        puntos: basePoints,
        sortPoints: basePoints,
        gym_bonus_pct: isUser ? userBonusPct : 0,
      };
    })
    .sort((a, b) => {
      if (b.sortPoints !== a.sortPoints) return b.sortPoints - a.sortPoints;
      return a.club_nombre.localeCompare(b.club_nombre, "es");
    })
    .map((row, index) => ({
      id: row.id,
      club_nombre: row.club_nombre,
      escudo_config: row.escudo_config,
      puntos: row.puntos,
      posicion: index + 1,
      gym_bonus_pct: row.gym_bonus_pct,
    }));

  return ranked;
});
