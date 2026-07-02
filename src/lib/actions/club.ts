"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assignStarterRoster,
  calculateRosterCost,
  getInitialContractFields,
  getNextAcademyDeadline,
  getNextScoutingDeadline,
  INITIAL_BUDGET,
} from "@/lib/game";
import type { EscudoConfig } from "@/lib/game/types";
import { UPGRADE_FACILITY_TYPES } from "@/lib/game/types";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/lib/game/types";

const FACILITY_TYPES = UPGRADE_FACILITY_TYPES;

export async function getUserClub() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return club;
}

export async function createClub(formData: {
  nombre: string;
  escudo_config: EscudoConfig;
  ciudad_ficticia?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  const existing = await getUserClub();
  if (existing) {
    return { error: "Ya tienes un club." };
  }

  const nombre = formData.nombre.trim();
  if (nombre.length < 3 || nombre.length > 30) {
    return { error: "El nombre debe tener entre 3 y 30 caracteres." };
  }

  const { data: allPlayers, error: playersError } = await supabase
    .from("players_master")
    .select("*");

  if (playersError || !allPlayers?.length) {
    return { error: "No hay jugadores disponibles. Ejecuta el seed." };
  }

  const starterPlayers = assignStarterRoster(allPlayers as Player[]);
  const starterCost = calculateRosterCost(starterPlayers);

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({
      user_id: user.id,
      nombre,
      escudo_config: formData.escudo_config,
      ciudad_ficticia: formData.ciudad_ficticia ?? null,
      presupuesto: INITIAL_BUDGET - starterCost,
      onboarding_completado: false,
      sobres_restantes: 4,
    })
    .select()
    .single();

  if (clubError || !club) {
    return { error: clubError?.message ?? "Error al crear el club." };
  }

  const rosterRows = starterPlayers.map((player) => ({
    club_id: club.id,
    player_id: player.id,
    es_titular: false,
    ...getInitialContractFields(player.rareza, true),
  }));

  const { error: rosterError } = await supabase
    .from("club_roster")
    .insert(rosterRows);

  if (rosterError) {
    return { error: rosterError.message };
  }

  const facilityRows = FACILITY_TYPES.map((tipo) => ({
    club_id: club.id,
    tipo,
    nivel: 1,
  }));

  const { error: facilitiesError } = await supabase
    .from("facilities")
    .insert(facilityRows);

  if (facilitiesError) {
    return { error: facilitiesError.message };
  }

  const scoutingGeneraEn = getNextScoutingDeadline(1);
  const { error: scoutingError } = await supabase
    .from("scouting_packs")
    .insert({
      club_id: club.id,
      genera_en: scoutingGeneraEn.toISOString(),
      estado: "timer",
    });

  if (scoutingError) {
    return { error: scoutingError.message };
  }

  const academyGeneraEn = getNextAcademyDeadline(1);
  const { error: academyError } = await supabase.from("academy_packs").insert({
    club_id: club.id,
    genera_en: academyGeneraEn.toISOString(),
    estado: "timer",
  });

  if (academyError) {
    return { error: academyError.message };
  }

  revalidatePath("/");
  redirect("/onboarding/sobres");
}
