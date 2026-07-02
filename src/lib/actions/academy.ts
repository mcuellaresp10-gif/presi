"use server";

import { revalidatePath } from "next/cache";
import {
  applySigningDiscount,
  canAddPlayer,
  countPositions,
  createMathRng,
  generateAcademyPlayer,
  getInitialContractFields,
  getNextAcademyDeadline,
  isAcademyPackReady,
} from "@/lib/game";
import type { Player } from "@/lib/game/types";
import { getUserClub } from "@/lib/actions/club";
import { getOfficeDiscountForClub } from "@/lib/actions/facilities";
import { createClient } from "@/lib/supabase/server";

async function getAcademyNivel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<number> {
  const { data } = await supabase
    .from("facilities")
    .select("nivel")
    .eq("club_id", clubId)
    .eq("tipo", "academia")
    .maybeSingle();
  return data?.nivel ?? 1;
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
  const { data: allPlayers } = await supabase.from("players_master").select("*");
  const rosterIds = new Set(roster.map((p) => p.id));
  return (allPlayers as Player[]).filter((p) => !rosterIds.has(p.id));
}

async function ensureAcademyPackReady(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
) {
  const { data: pack } = await supabase
    .from("academy_packs")
    .select("*")
    .eq("club_id", clubId)
    .maybeSingle();

  if (!pack) return null;

  if (pack.estado === "listo" && pack.player_id) {
    return pack;
  }

  if (pack.estado === "timer" && isAcademyPackReady(pack.genera_en)) {
    const roster = await getRosterPlayers(supabase, clubId);
    const pool = await getAvailablePool(supabase, roster);
    const player = generateAcademyPlayer(
      pool,
      countPositions(roster),
      createMathRng()
    );

    if (!player) return pack;

    const { data: updated } = await supabase
      .from("academy_packs")
      .update({
        player_id: player.id,
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

export async function getAcademyState() {
  const club = await getUserClub();
  if (!club) return null;

  const supabase = await createClient();
  const academyNivel = await getAcademyNivel(supabase, club.id);

  const { data: initialPack, error: packError } = await supabase
    .from("academy_packs")
    .select("*")
    .eq("club_id", club.id)
    .maybeSingle();

  let pack = initialPack;

  if (packError) {
    console.error("academy_packs query failed:", packError.message);
    return {
      pack: null,
      player: null,
      academyNivel,
      presupuesto: Number(club.presupuesto),
    };
  }

  if (!pack) {
    const generaEn = getNextAcademyDeadline(academyNivel);
    const { data: created, error: insertError } = await supabase
      .from("academy_packs")
      .insert({
        club_id: club.id,
        genera_en: generaEn.toISOString(),
        estado: "timer",
      })
      .select()
      .single();

    if (insertError) {
      console.error("academy_packs insert failed:", insertError.message);
      return {
        pack: null,
        player: null,
        academyNivel,
        presupuesto: Number(club.presupuesto),
      };
    }
    pack = created;
  }

  if (!pack) return null;

  pack = await ensureAcademyPackReady(supabase, club.id);

  let player: Player | null = null;
  if (pack?.player_id) {
    const { data } = await supabase
      .from("players_master")
      .select("*")
      .eq("id", pack.player_id)
      .maybeSingle();
    player = data as Player | null;
  }

  return {
    pack,
    player,
    academyNivel,
    presupuesto: Number(club.presupuesto),
  };
}

async function scheduleNextAcademyPack(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  academyNivel: number
) {
  const generaEn = getNextAcademyDeadline(academyNivel);
  await supabase
    .from("academy_packs")
    .update({
      genera_en: generaEn.toISOString(),
      player_id: null,
      estado: "timer",
      updated_at: new Date().toISOString(),
    })
    .eq("club_id", clubId);
}

export async function claimAcademyPlayer() {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  const academyNivel = await getAcademyNivel(supabase, club.id);
  const officeDiscount = await getOfficeDiscountForClub(club.id);

  const pack = await ensureAcademyPackReady(supabase, club.id);
  if (!pack || pack.estado !== "listo" || !pack.player_id) {
    return { error: "No hay promesa de academia lista." };
  }

  const { data: player } = await supabase
    .from("players_master")
    .select("*")
    .eq("id", pack.player_id)
    .single();

  if (!player) return { error: "Jugador no encontrado." };

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

  await scheduleNextAcademyPack(supabase, club.id, academyNivel);

  revalidatePath("/instalaciones");
  revalidatePath("/inicio");
  revalidatePath("/plantilla");

  return { success: true, player, finalCost };
}

export async function rejectAcademyPlayer() {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  const academyNivel = await getAcademyNivel(supabase, club.id);

  const pack = await ensureAcademyPackReady(supabase, club.id);
  if (!pack || pack.estado !== "listo") {
    return { error: "No hay promesa de academia lista." };
  }

  await scheduleNextAcademyPack(supabase, club.id, academyNivel);

  revalidatePath("/instalaciones");
  revalidatePath("/inicio");

  return { success: true };
}
