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
import { getNextLoanRefresh } from "@/lib/game/loan-market";
import { sanitizeEscudoConfig } from "@/lib/game/escudo-sanitize";
import type { EscudoConfig } from "@/lib/game/types";
import { UPGRADE_FACILITY_TYPES } from "@/lib/game/types";
import { createClient } from "@/lib/supabase/server";
import { getUserClubCached } from "@/lib/queries/request-cache";
import { fetchApiPlayersMaster } from "@/lib/db/player-pool";
import type { Player } from "@/lib/game/types";

const FACILITY_TYPES = UPGRADE_FACILITY_TYPES;

export async function getUserClub() {
  return getUserClubCached();
}

export async function createClub(formData: {
  nombre: string;
  escudo_config: EscudoConfig;
  ciudad_ficticia?: string;
  apodo?: string;
  estilo?: string;
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

  const apodo = formData.apodo?.trim().toUpperCase() ?? null;
  if (apodo && (apodo.length < 2 || apodo.length > 6)) {
    return { error: "El apodo debe tener entre 2 y 6 caracteres." };
  }

  const ciudad = formData.ciudad_ficticia?.trim() ?? null;
  if (ciudad && ciudad.length > 40) {
    return { error: "La ciudad no puede superar 40 caracteres." };
  }

  const escudoResult = sanitizeEscudoConfig(formData.escudo_config);
  if (!escudoResult.ok) {
    return { error: escudoResult.error };
  }

  const allPlayers = await fetchApiPlayersMaster(supabase);

  if (!allPlayers.length) {
    return {
      error:
        "No hay jugadores reales sincronizados. Configura API_FOOTBALL_KEY y ejecuta el sync de jugadores.",
    };
  }

  const starterPlayers = assignStarterRoster(allPlayers as Player[]);
  const starterCost = calculateRosterCost(starterPlayers);

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({
      user_id: user.id,
      nombre,
      escudo_config: escudoResult.config,
      ciudad_ficticia: ciudad,
      apodo,
      estilo: formData.estilo?.trim() || null,
      presupuesto: INITIAL_BUDGET - starterCost,
      gemas: 150,
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

  const loanRefreshEn = getNextLoanRefresh().toISOString();
  await supabase.from("loan_market_state").insert({
    club_id: club.id,
    refresh_en: loanRefreshEn,
    offers: [],
  });

  revalidatePath("/");
  redirect("/onboarding/sobres");
}

export async function updateClub(formData: {
  nombre: string;
  escudo_config: EscudoConfig;
  ciudad_ficticia?: string;
  apodo?: string;
  estilo?: string;
}) {
  const supabase = await createClient();
  const club = await getUserClub();
  if (!club) {
    return { error: "No tienes club." };
  }

  const nombre = formData.nombre.trim();
  if (nombre.length < 3 || nombre.length > 30) {
    return { error: "El nombre debe tener entre 3 y 30 caracteres." };
  }

  const apodo = formData.apodo?.trim().toUpperCase() ?? null;
  if (apodo && (apodo.length < 2 || apodo.length > 6)) {
    return { error: "El apodo debe tener entre 2 y 6 caracteres." };
  }

  const ciudad = formData.ciudad_ficticia?.trim() ?? null;
  if (ciudad && ciudad.length > 40) {
    return { error: "La ciudad no puede superar 40 caracteres." };
  }

  const escudoResult = sanitizeEscudoConfig(formData.escudo_config);
  if (!escudoResult.ok) {
    return { error: escudoResult.error };
  }

  const { error } = await supabase
    .from("clubs")
    .update({
      nombre,
      escudo_config: escudoResult.config,
      ciudad_ficticia: ciudad,
      apodo,
      estilo: formData.estilo?.trim() || null,
    })
    .eq("id", club.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inicio");
  revalidatePath("/perfil");
  revalidatePath("/ranking");
  revalidatePath("/ligas");
  return { success: true };
}
