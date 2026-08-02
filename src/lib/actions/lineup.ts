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

  let gameweek =
    (gameweekId ? await getGameweekById(gameweekId) : null) ??
    (await resolveGameweekForDraftSave());

  // Stale client ids often point at a live GW that still has matches left.
  // Fall back to the true upcoming editable jornada instead of failing.
  if (gameweek && computeIsLineupLocked(gameweek, gameweek)) {
    const open = await resolveGameweekForDraftSave();
    if (!open || computeIsLineupLocked(open, open)) {
      return {
        error: "La jornada ya comenzó. No puedes cambiar la alineación.",
      };
    }
    gameweek = open;
  }

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
