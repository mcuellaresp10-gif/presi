"use server";

import { revalidatePath } from "next/cache";
import {
  canAddPlayer,
  countPositions,
  createMathRng,
  generatePackOptions,
  getInitialContractFields,
} from "@/lib/game";
import type { Player } from "@/lib/game/types";
import { getUserClub } from "@/lib/actions/club";
import { getAvailableApiPlayerPool } from "@/lib/db/player-pool";
import { createClient } from "@/lib/supabase/server";

export async function openWelcomePack() {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };
  if (club.sobres_restantes <= 0) {
    return { error: "No te quedan sobres." };
  }

  const supabase = await createClient();
  const packNumber = 5 - club.sobres_restantes;

  const { data: existing } = await supabase
    .from("welcome_pack_sessions")
    .select("*")
    .eq("club_id", club.id)
    .eq("pack_number", packNumber)
    .maybeSingle();

  if (existing && !existing.elegido_id) {
    const optionIds = Array.isArray(existing.opciones)
      ? (existing.opciones as string[])
      : [];

    const { data: optionPlayers } = await supabase
      .from("players_master")
      .select("*")
      .in("id", optionIds);

    if (optionPlayers && optionPlayers.length > 0) {
      return {
        packNumber,
        options: optionPlayers as Player[],
        sessionId: existing.id,
      };
    }

    // Sesión corrupta o jugadores borrados — eliminar y regenerar
    await supabase
      .from("welcome_pack_sessions")
      .delete()
      .eq("id", existing.id);
  }

  const { data: rosterRows } = await supabase
    .from("club_roster")
    .select("player_id, players_master(*)")
    .eq("club_id", club.id);

  const rosterPlayers = (rosterRows ?? []).map(
    (row) => row.players_master as unknown as Player
  );

  const availablePool = await getAvailableApiPlayerPool(
    supabase,
    rosterPlayers
  );

  const options = generatePackOptions(
    availablePool,
    countPositions(rosterPlayers),
    3,
    createMathRng(),
    Number(club.presupuesto)
  );

  if (options.length === 0) {
    return { error: "No se pudieron generar jugadores para este sobre." };
  }

  const { data: session, error } = await supabase
    .from("welcome_pack_sessions")
    .insert({
      club_id: club.id,
      pack_number: packNumber,
      opciones: options.map((p) => p.id),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { packNumber, options, sessionId: session.id };
}

export async function selectPackPlayer(sessionId: string, playerId: string) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("welcome_pack_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("club_id", club.id)
    .single();

  if (!session) return { error: "Sobre no encontrado." };
  if (session.elegido_id) return { error: "Ya elegiste en este sobre." };

  const optionIds = session.opciones as string[];
  if (!optionIds.includes(playerId)) {
    return { error: "Jugador no válido para este sobre." };
  }

  const { data: player } = await supabase
    .from("players_master")
    .select("*")
    .eq("id", playerId)
    .single();

  if (!player) return { error: "Jugador no encontrado." };

  if (Number(club.presupuesto) < Number(player.costo_base)) {
    return { error: "Presupuesto insuficiente." };
  }

  const { data: rosterRows } = await supabase
    .from("club_roster")
    .select("players_master(*)")
    .eq("club_id", club.id);

  const roster = (rosterRows ?? []).map(
    (r) => r.players_master as unknown as Player
  );

  const addCheck = canAddPlayer(roster, player as Player);
  if (!addCheck.ok) return { error: addCheck.reason };

  const { error: rosterError } = await supabase.from("club_roster").insert({
    club_id: club.id,
    player_id: playerId,
    es_titular: false,
    ...getInitialContractFields((player as Player).rareza, true),
  });

  if (rosterError) return { error: rosterError.message };

  const newBudget = Number(club.presupuesto) - Number(player.costo_base);
  const newSobres = club.sobres_restantes - 1;
  const onboardingDone = newSobres === 0;

  const { error: clubError } = await supabase
    .from("clubs")
    .update({
      presupuesto: newBudget,
      sobres_restantes: newSobres,
      onboarding_completado: onboardingDone,
    })
    .eq("id", club.id);

  if (clubError) return { error: clubError.message };

  await supabase
    .from("welcome_pack_sessions")
    .update({ elegido_id: playerId })
    .eq("id", sessionId);

  revalidatePath("/onboarding/sobres");
  revalidatePath("/plantilla");

  return { success: true, onboardingDone };
}
