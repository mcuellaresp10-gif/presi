"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { getUserClub } from "@/lib/actions/club";
import { getGymLeagueBonusForClub } from "@/lib/actions/facilities";
import { createClient } from "@/lib/supabase/server";
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

  const { data: realRows } = await supabase
    .from("club_season_points")
    .select("total_points, clubs(id, nombre, escudo_config)")
    .eq("season", season)
    .order("total_points", { ascending: false });

  if (realRows && realRows.length > 0) {
    const bonusPct = club ? await getGymLeagueBonusForClub(club.id) : 0;
    const multiplier = 1 + bonusPct / 100;

    const validRows = realRows.filter((row) => row.clubs != null);

    if (validRows.length > 0) {
      return validRows.map((row, index) => {
        const clubData = row.clubs as unknown as {
          id: string;
          nombre: string;
          escudo_config: unknown;
        };
        const isUser = club && clubData.nombre === club.nombre;
        const basePoints = Number(row.total_points);
        return {
          id: clubData.id,
          club_nombre: clubData.nombre,
          escudo_config: clubData.escudo_config,
          puntos: isUser ? Math.round(basePoints * multiplier) : basePoints,
          posicion: index + 1,
          gym_bonus_pct: isUser ? bonusPct : 0,
        };
      });
    }
  }

  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, nombre, escudo_config")
    .order("nombre", { ascending: true });

  const bonusPct = club ? await getGymLeagueBonusForClub(club.id) : 0;

  return (clubs ?? []).map((row, index) => ({
    id: row.id,
    club_nombre: row.nombre,
    escudo_config: row.escudo_config,
    puntos: 0,
    posicion: index + 1,
    gym_bonus_pct: row.nombre === club?.nombre ? bonusPct : 0,
  }));
});
