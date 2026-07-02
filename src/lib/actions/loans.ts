"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getUserClub } from "@/lib/actions/club";

async function deleteLoanPlayer(clubId: string, playerId: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("club_roster")
    .delete()
    .eq("club_id", clubId)
    .eq("player_id", playerId)
    .eq("es_prestamo", true)
    .select("player_id");
  return { deleted: data ?? [], error };
}

export async function expireLoanPlayers(clubId?: string) {
  const supabase = await createClient();

  let targetClubId: string;
  if (clubId) {
    targetClubId = clubId;
  } else {
    const club = await getUserClub();
    if (!club) return { expired: [] as string[] };
    targetClubId = club.id;
  }

  const { data: rows, error } = await supabase
    .from("club_roster")
    .select("player_id, prestamo_jornadas_restantes")
    .eq("club_id", targetClubId)
    .eq("es_prestamo", true);

  if (error?.message?.includes("es_prestamo")) {
    return { expired: [] as string[] };
  }

  const expiredIds = (rows ?? [])
    .filter((row) => (row.prestamo_jornadas_restantes ?? 0) <= 0)
    .map((row) => row.player_id);

  if (expiredIds.length === 0) return { expired: [] as string[] };

  for (const playerId of expiredIds) {
    await deleteLoanPlayer(targetClubId, playerId);
  }

  revalidatePath("/plantilla");
  revalidatePath("/tienda");
  revalidatePath("/inicio");

  return { expired: expiredIds };
}

export async function tickLoanPlayersForGameweek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
) {
  const { data: rows, error } = await supabase
    .from("club_roster")
    .select("player_id, prestamo_jornadas_restantes")
    .eq("club_id", clubId)
    .eq("es_prestamo", true);

  if (error?.message?.includes("es_prestamo")) {
    return { expired: [] as string[] };
  }

  const expiredIds: string[] = [];

  for (const row of rows ?? []) {
    const remaining = Math.max(0, (row.prestamo_jornadas_restantes ?? 1) - 1);
    if (remaining <= 0) {
      expiredIds.push(row.player_id);
      await supabase
        .from("club_roster")
        .delete()
        .eq("club_id", clubId)
        .eq("player_id", row.player_id)
        .eq("es_prestamo", true);
    } else {
      await supabase
        .from("club_roster")
        .update({ prestamo_jornadas_restantes: remaining })
        .eq("club_id", clubId)
        .eq("player_id", row.player_id);
    }
  }

  return { expired: expiredIds };
}
