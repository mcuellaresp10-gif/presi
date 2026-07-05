"use server";

import { revalidatePath } from "next/cache";
import {
  canAddPlayer,
  canRenewContract,
  getInitialContractFields,
  getRenewalContractFields,
} from "@/lib/game";
import {
  canActivateWildCard,
  getWildCardDefinition,
  type WildCardType,
} from "@/lib/game/wild-cards";
import type { Player } from "@/lib/game/types";
import { getUserClub } from "@/lib/actions/club";
import { getCurrentGameweek } from "@/lib/actions/gameweek";
import { createClient } from "@/lib/supabase/server";
import { getAvailableApiPlayerPool } from "@/lib/db/player-pool";

export type WildCardInventoryItem = {
  id: string;
  cardType: WildCardType;
  status: "available" | "active" | "used";
  obtainedAt: string;
  activatedAt: string | null;
  gameweekId: string | null;
};

async function getRosterPlayers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<Player[]> {
  const { data } = await supabase
    .from("club_roster")
    .select("players_master(*)")
    .eq("club_id", clubId);

  return (data ?? []).map((r) => r.players_master as unknown as Player);
}

async function getAvailablePool(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roster: Player[]
): Promise<Player[]> {
  return getAvailableApiPlayerPool(supabase, roster);
}

export async function getWildCardInventory(): Promise<WildCardInventoryItem[]> {
  const club = await getUserClub();
  if (!club) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("club_wild_cards")
    .select("*")
    .eq("club_id", club.id)
    .in("status", ["available", "active"])
    .order("obtained_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    cardType: row.card_type as WildCardType,
    status: row.status as WildCardInventoryItem["status"],
    obtainedAt: row.obtained_at,
    activatedAt: row.activated_at,
    gameweekId: row.gameweek_id,
  }));
}

export async function getActiveGameweekWildCardsForClub(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  gameweekId: string
): Promise<WildCardType[]> {
  const { data } = await supabase
    .from("club_wild_cards")
    .select("card_type")
    .eq("club_id", clubId)
    .eq("gameweek_id", gameweekId)
    .eq("status", "active");

  return (data ?? []).map((r) => r.card_type as WildCardType);
}

export async function activateWildCard(
  cardId: string,
  payload?: { playerId?: string; signPlayerId?: string }
) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  const { data: card } = await supabase
    .from("club_wild_cards")
    .select("*")
    .eq("id", cardId)
    .eq("club_id", club.id)
    .maybeSingle();

  if (!card || card.status !== "available") {
    return { error: "Carta no disponible." };
  }

  const cardType = card.card_type as WildCardType;
  const gameweek = await getCurrentGameweek();

  const { data: activeCards } = await supabase
    .from("club_wild_cards")
    .select("card_type")
    .eq("club_id", club.id)
    .eq("status", "active");

  const activeGameweekTypes = (activeCards ?? []).map(
    (c) => c.card_type as WildCardType
  );

  const activationCheck = canActivateWildCard(
    cardType,
    gameweek?.status ?? null,
    activeGameweekTypes
  );
  if (!activationCheck.ok) {
    return { error: activationCheck.reason };
  }

  const now = new Date().toISOString();

  if (cardType === "free_sign") {
    const signPlayerId = payload?.signPlayerId;
    if (!signPlayerId) {
      return { error: "Selecciona un jugador para fichar." };
    }

    const { data: player } = await supabase
      .from("players_master")
      .select("*")
      .eq("id", signPlayerId)
      .maybeSingle();

    if (!player) return { error: "Jugador no encontrado." };

    const roster = await getRosterPlayers(supabase, club.id);
    const addCheck = canAddPlayer(roster, player as Player);
    if (!addCheck.ok) return { error: addCheck.reason };

    const { error: rosterError } = await supabase.from("club_roster").insert({
      club_id: club.id,
      player_id: signPlayerId,
      es_titular: false,
      ...getInitialContractFields((player as Player).rareza, false),
    });

    if (rosterError) return { error: rosterError.message };

    await supabase
      .from("club_wild_cards")
      .update({ status: "used", activated_at: now, used_at: now })
      .eq("id", cardId);
  } else if (cardType === "free_renewal") {
    const playerId = payload?.playerId;
    if (!playerId) {
      return { error: "Selecciona un jugador para renovar." };
    }

    const { data: rosterRow } = await supabase
      .from("club_roster")
      .select("player_id, renovaciones, players_master(rareza, costo_base)")
      .eq("club_id", club.id)
      .eq("player_id", playerId)
      .maybeSingle();

    if (!rosterRow) return { error: "El jugador no está en tu plantilla." };

    const pm = rosterRow.players_master as unknown as Player;
    if (!canRenewContract(rosterRow.renovaciones ?? 0)) {
      return { error: "Este jugador ya no puede renovar más." };
    }

    const fields = getRenewalContractFields(
      pm.rareza,
      rosterRow.renovaciones ?? 0
    );

    await supabase
      .from("club_roster")
      .update({
        jornadas_restantes: fields.jornadas_restantes,
        renovaciones: fields.renovaciones,
      })
      .eq("club_id", club.id)
      .eq("player_id", playerId);

    await supabase
      .from("club_wild_cards")
      .update({ status: "used", activated_at: now, used_at: now })
      .eq("id", cardId);
  } else if (cardType === "golden_scout") {
    await supabase
      .from("clubs")
      .update({ scouting_min_rarity: "oro" })
      .eq("id", club.id);

    await supabase
      .from("club_wild_cards")
      .update({ status: "used", activated_at: now, used_at: now })
      .eq("id", cardId);
  } else {
    if (!gameweek) {
      return { error: "No hay jornada activa para esta carta." };
    }

    await supabase
      .from("club_wild_cards")
      .update({
        status: "active",
        activated_at: now,
        gameweek_id: gameweek.id,
      })
      .eq("id", cardId);
  }

  revalidatePath("/perfil");
  revalidatePath("/instalaciones");
  revalidatePath("/inicio");
  revalidatePath("/plantilla");

  return {
    success: true,
    cardName: getWildCardDefinition(cardType).name,
  };
}

export async function getFreeSignPool() {
  const club = await getUserClub();
  if (!club) return [];

  const supabase = await createClient();
  const roster = await getRosterPlayers(supabase, club.id);
  return getAvailablePool(supabase, roster);
}

export async function markFinishedGameweekWildCards(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameweekId: string
) {
  const now = new Date().toISOString();
  await supabase
    .from("club_wild_cards")
    .update({ status: "used", used_at: now })
    .eq("gameweek_id", gameweekId)
    .eq("status", "active");
}
