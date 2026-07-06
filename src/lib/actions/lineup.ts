"use server";

import {
  assignSquadRoles,
  sanitizeLineupDraft,
} from "@/lib/game/squad-limits";
import type { Player } from "@/lib/game/types";
import {
  getCurrentGameweek,
  getGameweekById,
  resolveGameweekForDraftSave,
} from "@/lib/actions/gameweek";
import { computeIsLineupLocked } from "@/lib/gameweek/lineup-lock";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";

export async function saveLineupDraft(
  starterIds: string[],
  benchIds: string[],
  captainId: string | null,
  formationLabel?: string | null,
  gameweekId?: string | null
) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const gameweek =
    (gameweekId ? await getGameweekById(gameweekId) : null) ??
    (await resolveGameweekForDraftSave());

  if (!gameweek) {
    const current = await getCurrentGameweek();
    if (computeIsLineupLocked(null, current)) {
      return {
        error: "La jornada ya comenzó. No puedes cambiar la alineación.",
      };
    }
    return {
      error:
        "El calendario se está sincronizando. Intenta de nuevo en unos segundos.",
    };
  }

  if (computeIsLineupLocked(gameweek, gameweek)) {
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
  await Promise.all(
    Array.from(roles.entries()).map(([playerId, squadRole]) =>
      supabase
        .from("club_roster")
        .update({
          squad_role: squadRole,
          es_titular: squadRole === "starter",
        })
        .eq("club_id", club.id)
        .eq("player_id", playerId)
    )
  );

  return {
    success: true,
    gameweekId: gameweek.id,
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
