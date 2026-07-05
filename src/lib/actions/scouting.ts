"use server";

import { revalidatePath } from "next/cache";
import {
  applySigningDiscount,
  canAddPlayer,
  countPositions,
  createMathRng,
  generateScoutingReward,
  getInitialContractFields,
  getNextScoutingDeadline,
  isScoutingPackReady,
  normalizeScoutingPackDeadline,
} from "@/lib/game";
import {
  canClaimWildCard,
  getWildCardChance,
  getWildCardDefinition,
  type WildCardType,
} from "@/lib/game/wild-cards";
import type { Player } from "@/lib/game/types";
import { getUserClub } from "@/lib/actions/club";
import { getOfficeDiscountForClub } from "@/lib/actions/facilities";
import { createClient } from "@/lib/supabase/server";
import { getAvailableApiPlayerPool } from "@/lib/db/player-pool";

export type ScoutingRewardState =
  | { kind: "player"; player: Player }
  | { kind: "wild_card"; cardType: WildCardType }
  | null;

async function getScoutingNivel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<number> {
  const { data } = await supabase
    .from("facilities")
    .select("nivel")
    .eq("club_id", clubId)
    .eq("tipo", "scouting")
    .maybeSingle();
  return data?.nivel ?? 1;
}

async function getHinchasNivel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<number> {
  const { data: hinchas } = await supabase
    .from("facilities")
    .select("nivel")
    .eq("club_id", clubId)
    .eq("tipo", "hinchas")
    .maybeSingle();

  if (hinchas) return hinchas.nivel;

  const { data: estadio } = await supabase
    .from("facilities")
    .select("nivel")
    .eq("club_id", clubId)
    .eq("tipo", "estadio")
    .maybeSingle();

  return estadio?.nivel ?? 1;
}

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

async function getAvailableWildCardTypes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<WildCardType[]> {
  const { data } = await supabase
    .from("club_wild_cards")
    .select("card_type")
    .eq("club_id", clubId)
    .eq("status", "available");

  return (data ?? []).map((row) => row.card_type as WildCardType);
}

async function getClubScoutingMinRarity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<"oro" | null> {
  const { data } = await supabase
    .from("clubs")
    .select("scouting_min_rarity")
    .eq("id", clubId)
    .maybeSingle();
  return data?.scouting_min_rarity === "oro" ? "oro" : null;
}

async function clearClubScoutingMinRarity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
) {
  await supabase
    .from("clubs")
    .update({ scouting_min_rarity: null })
    .eq("id", clubId);
}

async function scheduleNextPack(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  scoutingNivel: number
) {
  const generaEn = getNextScoutingDeadline(scoutingNivel);
  await supabase
    .from("scouting_packs")
    .update({
      genera_en: generaEn.toISOString(),
      player_id: null,
      reward_type: "player",
      wild_card_type: null,
      estado: "timer",
      updated_at: new Date().toISOString(),
    })
    .eq("club_id", clubId);
}

async function ensurePackReady(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  scoutingNivel: number,
  hinchasNivel: number
) {
  let { data: pack } = await supabase
    .from("scouting_packs")
    .select("*")
    .eq("club_id", clubId)
    .maybeSingle();

  if (!pack) return null;

  if (pack.estado === "timer") {
    const normalized = normalizeScoutingPackDeadline(
      pack.genera_en,
      scoutingNivel
    );
    if (normalized.adjusted) {
      const { data: fixed } = await supabase
        .from("scouting_packs")
        .update({
          genera_en: normalized.generaEn,
          updated_at: new Date().toISOString(),
        })
        .eq("club_id", clubId)
        .select()
        .single();
      if (fixed) pack = fixed;
    }
  }

  const isReadyPack =
    pack.estado === "listo" &&
    (pack.player_id ||
      pack.reward_type === "wild_card" ||
      pack.wild_card_type);

  if (isReadyPack) {
    return pack;
  }

  if (pack.estado === "timer" && isScoutingPackReady(pack.genera_en)) {
    const roster = await getRosterPlayers(supabase, clubId);
    const pool = await getAvailablePool(supabase, roster);
    const minRarity = await getClubScoutingMinRarity(supabase, clubId);

    const reward = generateScoutingReward(
      pool,
      countPositions(roster),
      scoutingNivel,
      createMathRng(),
      { minRarity, hinchasNivel }
    );

    if (minRarity) {
      await clearClubScoutingMinRarity(supabase, clubId);
    }

    if (!reward) {
      return pack;
    }

    if (reward.kind === "wild_card") {
      const { data: updated } = await supabase
        .from("scouting_packs")
        .update({
          player_id: null,
          reward_type: "wild_card",
          wild_card_type: reward.cardType,
          estado: "listo",
          updated_at: new Date().toISOString(),
        })
        .eq("club_id", clubId)
        .select()
        .single();
      return updated;
    }

    const { data: updated } = await supabase
      .from("scouting_packs")
      .update({
        player_id: reward.player.id,
        reward_type: "player",
        wild_card_type: null,
        estado: "listo",
        updated_at: new Date().toISOString(),
      })
      .eq("club_id", clubId)
      .select()
      .single();

    return updated;
  }

  return pack;
}

async function resolveScoutingReward(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pack: {
    player_id: string | null;
    reward_type?: string;
    wild_card_type?: string | null;
  } | null
): Promise<ScoutingRewardState> {
  if (!pack) return null;

  if (pack.reward_type === "wild_card" && pack.wild_card_type) {
    return {
      kind: "wild_card",
      cardType: pack.wild_card_type as WildCardType,
    };
  }

  if (pack.player_id) {
    const { data } = await supabase
      .from("players_master")
      .select("*")
      .eq("id", pack.player_id)
      .maybeSingle();
    if (data) {
      return { kind: "player", player: data as Player };
    }
  }

  return null;
}

export async function getScoutingState() {
  const club = await getUserClub();
  if (!club) return null;

  const supabase = await createClient();
  const scoutingNivel = await getScoutingNivel(supabase, club.id);
  const hinchasNivel = await getHinchasNivel(supabase, club.id);
  const wildCardChancePct = Math.round(getWildCardChance(hinchasNivel) * 1000) / 10;

  const { data: initialPack, error: packError } = await supabase
    .from("scouting_packs")
    .select("*")
    .eq("club_id", club.id)
    .maybeSingle();

  let pack = initialPack;

  if (packError) {
    console.error("scouting_packs query failed:", packError.message);
    return {
      pack: null,
      reward: null,
      player: null,
      wildCardType: null,
      scoutingNivel,
      hinchasNivel,
      wildCardChancePct,
      presupuesto: Number(club.presupuesto),
    };
  }

  if (!pack) {
    const generaEn = getNextScoutingDeadline(scoutingNivel);
    const { data: created, error: insertError } = await supabase
      .from("scouting_packs")
      .insert({
        club_id: club.id,
        genera_en: generaEn.toISOString(),
        estado: "timer",
      })
      .select()
      .single();

    if (insertError) {
      console.error("scouting_packs insert failed:", insertError.message);
      return {
        pack: null,
        reward: null,
        player: null,
        wildCardType: null,
        scoutingNivel,
        hinchasNivel,
        wildCardChancePct,
        presupuesto: Number(club.presupuesto),
      };
    }

    pack = created;
  }

  if (!pack) return null;

  pack = await ensurePackReady(supabase, club.id, scoutingNivel, hinchasNivel);
  const reward = await resolveScoutingReward(supabase, pack);

  return {
    pack,
    reward,
    player: reward?.kind === "player" ? reward.player : null,
    wildCardType: reward?.kind === "wild_card" ? reward.cardType : null,
    scoutingNivel,
    hinchasNivel,
    wildCardChancePct,
    presupuesto: Number(club.presupuesto),
  };
}

export async function claimScoutingPlayer() {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  const scoutingNivel = await getScoutingNivel(supabase, club.id);
  const hinchasNivel = await getHinchasNivel(supabase, club.id);

  const pack = await ensurePackReady(
    supabase,
    club.id,
    scoutingNivel,
    hinchasNivel
  );
  if (!pack || pack.estado !== "listo") {
    return { error: "No hay sobre de scouting listo." };
  }

  if (pack.reward_type === "wild_card" && pack.wild_card_type) {
    const availableTypes = await getAvailableWildCardTypes(supabase, club.id);
    const claimCheck = canClaimWildCard(
      availableTypes,
      pack.wild_card_type as WildCardType
    );
    if (!claimCheck.ok) {
      return { error: claimCheck.reason };
    }

    const { error: insertError } = await supabase.from("club_wild_cards").insert({
      club_id: club.id,
      card_type: pack.wild_card_type,
      status: "available",
    });

    if (insertError) return { error: insertError.message };

    await scheduleNextPack(supabase, club.id, scoutingNivel);

    revalidatePath("/instalaciones");
    revalidatePath("/inicio");
    revalidatePath("/perfil");
    revalidatePath("/plantilla");

    return {
      success: true,
      wildCard: getWildCardDefinition(pack.wild_card_type as WildCardType),
    };
  }

  if (!pack.player_id) {
    return { error: "No hay recompensa en el sobre." };
  }

  const { data: player } = await supabase
    .from("players_master")
    .select("*")
    .eq("id", pack.player_id)
    .single();

  if (!player) return { error: "Jugador no encontrado." };

  const officeDiscount = await getOfficeDiscountForClub(club.id);
  const finalCost = applySigningDiscount(
    Number(player.costo_base),
    officeDiscount
  );

  if (Number(club.presupuesto) < finalCost) {
    return { error: "Presupuesto insuficiente." };
  }

  const roster = await getRosterPlayers(supabase, club.id);
  const addCheck = canAddPlayer(roster, player as Player);
  if (!addCheck.ok) return { error: addCheck.reason };

  const { error: rosterError } = await supabase.from("club_roster").insert({
    club_id: club.id,
    player_id: pack.player_id,
    es_titular: false,
    ...getInitialContractFields((player as Player).rareza, false),
  });

  if (rosterError) return { error: rosterError.message };

  const newBudget = Number(club.presupuesto) - finalCost;
  await supabase
    .from("clubs")
    .update({ presupuesto: newBudget })
    .eq("id", club.id);

  await scheduleNextPack(supabase, club.id, scoutingNivel);

  revalidatePath("/instalaciones");
  revalidatePath("/inicio");
  revalidatePath("/plantilla");

  return { success: true, player };
}

export async function rejectScoutingPlayer() {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  const scoutingNivel = await getScoutingNivel(supabase, club.id);
  const hinchasNivel = await getHinchasNivel(supabase, club.id);

  const pack = await ensurePackReady(
    supabase,
    club.id,
    scoutingNivel,
    hinchasNivel
  );
  if (!pack || pack.estado !== "listo") {
    return { error: "No hay sobre de scouting listo." };
  }

  await scheduleNextPack(supabase, club.id, scoutingNivel);

  revalidatePath("/instalaciones");
  revalidatePath("/inicio");
  revalidatePath("/perfil");

  return { success: true };
}
