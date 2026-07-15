"use server";

import { revalidatePath } from "next/cache";
import {
  canRenewContract,
  getReleaseRefund,
  getRenewalContractFields,
  getRenewalCost,
  isContractExpired,
} from "@/lib/game";
import type { Player, Rarity } from "@/lib/game/types";
import { getCurrentGameweek } from "@/lib/actions/gameweek";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { isNpcClubEstilo } from "@/lib/game/npc";

async function deleteRosterPlayer(clubId: string, playerId: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("club_roster")
    .delete()
    .eq("club_id", clubId)
    .eq("player_id", playerId)
    .select("player_id");
  return { deleted: data ?? [], error };
}

async function getOficinaNivel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<number> {
  const { data } = await supabase
    .from("facilities")
    .select("nivel")
    .eq("club_id", clubId)
    .eq("tipo", "oficina")
    .maybeSingle();
  return data?.nivel ?? 1;
}

export async function expireRosterContracts(clubId?: string) {
  const supabase = await createClient();

  let targetClubId: string;
  if (clubId) {
    targetClubId = clubId;
  } else {
    const c = await getUserClub();
    if (!c) return { expired: [] as string[] };
    targetClubId = c.id;
  }

  {
    const { data: clubMeta } = await supabase
      .from("clubs")
      .select("estilo")
      .eq("id", targetClubId)
      .maybeSingle();
    if (isNpcClubEstilo(clubMeta?.estilo)) {
      return { expired: [] as string[] };
    }
  }

  const { data: rows, error } = await supabase
    .from("club_roster")
    .select("player_id, jornadas_restantes, es_prestamo")
    .eq("club_id", targetClubId);

  if (error?.message?.includes("jornadas_restantes")) {
    return { expired: [] as string[] };
  }

  if (!rows?.length) return { expired: [] as string[] };

  const expiredIds = rows
    .filter(
      (row) => !row.es_prestamo && isContractExpired(row.jornadas_restantes)
    )
    .map((row) => row.player_id);

  if (expiredIds.length === 0) return { expired: [] as string[] };

  for (const playerId of expiredIds) {
    await deleteRosterPlayer(targetClubId, playerId);
  }

  revalidatePath("/plantilla");
  revalidatePath("/inicio");
  revalidatePath("/instalaciones");

  return { expired: expiredIds };
}

export async function renewPlayerContract(playerId: string) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();

  const { data: row } = await supabase
    .from("club_roster")
    .select("*, players_master(*)")
    .eq("club_id", club.id)
    .eq("player_id", playerId)
    .maybeSingle();

  if (!row) return { error: "Jugador no encontrado en tu plantilla." };

  const player = row.players_master as unknown as Player;
  const renovaciones = row.renovaciones ?? 0;

  if (!canRenewContract(renovaciones)) {
    return { error: "Este jugador ya alcanzó el máximo de renovaciones." };
  }

  const oficinaNivel = await getOficinaNivel(supabase, club.id);
  const cost = getRenewalCost(Number(player.costo_base), oficinaNivel, renovaciones);

  if (Number(club.presupuesto) < cost) {
    return { error: "Presupuesto insuficiente para renovar." };
  }

  const fields = getRenewalContractFields(
    player.rareza as Rarity,
    renovaciones
  );

  const { error: rosterError } = await supabase
    .from("club_roster")
    .update(fields)
    .eq("club_id", club.id)
    .eq("player_id", playerId);

  if (rosterError) return { error: rosterError.message };

  await supabase
    .from("clubs")
    .update({ presupuesto: Number(club.presupuesto) - cost })
    .eq("id", club.id);

  revalidatePath("/plantilla");
  revalidatePath("/inicio");

  return { success: true, cost };
}

export async function releasePlayer(playerId: string) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();

  const { data: row } = await supabase
    .from("club_roster")
    .select("*, players_master(*)")
    .eq("club_id", club.id)
    .eq("player_id", playerId)
    .maybeSingle();

  if (!row) return { error: "Jugador no encontrado en tu plantilla." };

  const player = row.players_master as unknown as Player;
  const oficinaNivel = await getOficinaNivel(supabase, club.id);
  const refund = getReleaseRefund(Number(player.costo_base), oficinaNivel);

  const { deleted, error } = await deleteRosterPlayer(club.id, playerId);

  if (error) return { error: error.message };
  if (!deleted.length) {
    return { error: "No se pudo liberar al jugador." };
  }

  const gameweek = await getCurrentGameweek();
  if (gameweek) {
    const { data: draft } = await supabase
      .from("lineup_drafts")
      .select("starter_ids, bench_ids")
      .eq("club_id", club.id)
      .eq("gameweek_id", gameweek.id)
      .maybeSingle();

    const inDraft =
      draft &&
      (draft.starter_ids?.includes(playerId) ||
        draft.bench_ids?.includes(playerId));

    if (inDraft) {
      await supabase
        .from("lineup_drafts")
        .delete()
        .eq("club_id", club.id)
        .eq("gameweek_id", gameweek.id);
    }
  }

  if (refund > 0) {
    await supabase
      .from("clubs")
      .update({ presupuesto: Number(club.presupuesto) + refund })
      .eq("id", club.id);
  }

  revalidatePath("/plantilla");
  revalidatePath("/inicio");

  return { success: true, refund };
}

export async function getContractsSummary() {
  const club = await getUserClub();
  if (!club) return null;

  await expireRosterContracts(club.id);

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("club_roster")
    .select("jornadas_restantes, renovaciones")
    .eq("club_id", club.id);

  const expiringSoon = (rows ?? []).filter(
    (row) => row.jornadas_restantes <= 1
  ).length;

  return {
    expiringSoon,
  };
}
