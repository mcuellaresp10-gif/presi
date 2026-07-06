"use server";

import { revalidatePath } from "next/cache";
import {
  assignSquadRoles,
  sanitizeLineupDraft,
} from "@/lib/game/squad-limits";
import type { Player } from "@/lib/game/types";
import { getEditableGameweek, isGameweekEditable } from "@/lib/actions/gameweek";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";

export async function saveLineupDraft(
  starterIds: string[],
  benchIds: string[],
  captainId: string | null,
  formationLabel?: string | null
) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const gameweek = await getEditableGameweek();
  if (!gameweek) {
    return { error: "No hay jornada abierta para editar. La actual ya comenzó." };
  }

  if (!(await isGameweekEditable(gameweek, club.id))) {
    return {
      error: "La jornada ya comenzó. No puedes cambiar la alineación.",
    };
  }

  const supabase = await createClient();

  const { data: rosterRows } = await supabase
    .from("club_roster")
    .select("player_id, players_master(*)")
    .eq("club_id", club.id);

  const rosterPlayers = (rosterRows ?? []).map(
    (row) => row.players_master as unknown as Player
  );
  const rosterIds = rosterPlayers.map((p) => p.id);

  const sanitized = sanitizeLineupDraft(
    starterIds,
    benchIds,
    captainId,
    rosterPlayers
  );
  if (!sanitized.ok) {
    return { error: sanitized.reason };
  }

  const {
    starterIds: cleanStarters,
    benchIds: cleanBench,
    captainId: cleanCaptain,
    formation: derivedFormation,
  } = sanitized;

  const { error: draftError } = await supabase.from("lineup_drafts").upsert(
    {
      club_id: club.id,
      gameweek_id: gameweek.id,
      starter_ids: cleanStarters,
      bench_ids: cleanBench,
      captain_id: cleanCaptain,
      formation: derivedFormation ?? formationLabel ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "club_id,gameweek_id" }
  );

  if (draftError) return { error: draftError.message };

  const roles = assignSquadRoles(rosterIds, cleanStarters, cleanBench);
  for (const [playerId, squadRole] of Array.from(roles.entries())) {
    await supabase
      .from("club_roster")
      .update({
        squad_role: squadRole,
        es_titular: squadRole === "starter",
      })
      .eq("club_id", club.id)
      .eq("player_id", playerId);
  }

  revalidatePath("/plantilla");
  revalidatePath("/inicio");

  return {
    success: true,
    formation: derivedFormation ?? formationLabel ?? null,
    isComplete:
      cleanStarters.length === 11 &&
      cleanBench.length === 5 &&
      !!cleanCaptain,
  };
}

/** @deprecated Use saveLineupDraft */
export async function saveLineup(starterIds: string[]) {
  if (starterIds.length !== 11) {
    return { error: "Debes seleccionar 11 titulares." };
  }
  return {
    error: "Usa saveLineupDraft con 11 titulares y 5 de banca.",
  };
}
