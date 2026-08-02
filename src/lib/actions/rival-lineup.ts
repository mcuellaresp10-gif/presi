"use server";

import { cache } from "react";
import { getUserClub } from "@/lib/actions/club";
import {
  getCurrentGameweek,
  getPointsGameweek,
  type GameweekPublic,
} from "@/lib/actions/gameweek";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getWildCardDefinition } from "@/lib/game/wild-cards";
import type { WildCardType } from "@/lib/game/wild-cards";
import type { EscudoConfig, Player, Position } from "@/lib/game/types";
import { validateFormation } from "@/lib/game/formation";
import { deriveGameweekStatus } from "@/lib/gameweek/status";
import { getActiveTournamentPhase } from "@/lib/gameweek/tournament";

export type RivalLineupPlayer = {
  id: string;
  nombre: string;
  posicion: Position;
  equipo_real: string;
  photo_url: string | null;
  rareza: Player["rareza"];
  isCaptain: boolean;
  role: "starter" | "bench";
  /** Points scored in the current/preview gameweek (if calculated). */
  points?: number | null;
};

export type RivalWildCardPreview = {
  cardType: WildCardType;
  name: string;
  description: string;
};

export type RivalLineupPreview = {
  clubId: string;
  clubNombre: string;
  escudoConfig: EscudoConfig | null;
  gameweekRound: number | null;
  source: "snapshot" | "draft" | "none";
  locked: boolean;
  formation: string | null;
  starters: RivalLineupPlayer[];
  bench: RivalLineupPlayer[];
  captainId: string | null;
  wildCards: RivalWildCardPreview[];
};

export const getClubLineupPreview = cache(async function getClubLineupPreview(
  clubId: string,
  /** Prefer the same gameweek as home VS points (pass from page). */
  gameweekId?: string | null
): Promise<RivalLineupPreview | null> {
  const myClub = await getUserClub();
  if (!myClub || !clubId) return null;

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return null;
  }

  const gameweek = await resolvePreviewGameweek(admin, gameweekId);

  const { data: targetClub } = await admin
    .from("clubs")
    .select("id, nombre, escudo_config, onboarding_completado")
    .eq("id", clubId)
    .maybeSingle();

  if (!targetClub?.onboarding_completado) return null;

  const empty: RivalLineupPreview = {
    clubId: targetClub.id,
    clubNombre: targetClub.nombre,
    escudoConfig: (targetClub.escudo_config as EscudoConfig) ?? null,
    gameweekRound: gameweek?.round ?? null,
    source: "none",
    locked: false,
    formation: null,
    starters: [],
    bench: [],
    captainId: null,
    wildCards: [],
  };

  if (!gameweek) return empty;

  const [
    { data: snapshot },
    { data: draft },
    { data: activeCards },
    { data: gwPoints },
  ] = await Promise.all([
    admin
      .from("lineup_snapshots")
      .select("starter_ids, bench_ids, captain_id, formation, is_valid")
      .eq("club_id", clubId)
      .eq("gameweek_id", gameweek.id)
      .maybeSingle(),
    admin
      .from("lineup_drafts")
      .select("starter_ids, bench_ids, captain_id, formation")
      .eq("club_id", clubId)
      .eq("gameweek_id", gameweek.id)
      .maybeSingle(),
    admin
      .from("club_wild_cards")
      .select("card_type")
      .eq("club_id", clubId)
      .eq("gameweek_id", gameweek.id)
      .eq("status", "active"),
    admin
      .from("club_gameweek_points")
      .select("breakdown")
      .eq("club_id", clubId)
      .eq("gameweek_id", gameweek.id)
      .maybeSingle(),
  ]);

  const pointsByPlayerId = new Map<string, number>();
  const rawBreakdown = gwPoints?.breakdown;
  const hasScoringData = gwPoints != null;
  if (Array.isArray(rawBreakdown)) {
    for (const row of rawBreakdown as Array<{
      playerId?: string;
      points?: number;
    }>) {
      if (row.playerId && typeof row.points === "number") {
        pointsByPlayerId.set(row.playerId, row.points);
      }
    }
  }

  const lineup = snapshot ?? draft;
  const source: RivalLineupPreview["source"] = snapshot
    ? "snapshot"
    : draft
      ? "draft"
      : "none";

  const starterIds = ((lineup?.starter_ids as string[]) ?? []).filter(Boolean);
  const benchIds = ((lineup?.bench_ids as string[]) ?? []).filter(Boolean);
  const captainId = (lineup?.captain_id as string | null) ?? null;
  const storedFormation =
    typeof lineup?.formation === "string" && lineup.formation.length > 0
      ? lineup.formation
      : null;
  const allIds = [...starterIds, ...benchIds];

  let starters: RivalLineupPlayer[] = [];
  let bench: RivalLineupPlayer[] = [];

  if (allIds.length > 0) {
    const { data: players } = await admin
      .from("players_master")
      .select("id, nombre, posicion, equipo_real, photo_url, rareza")
      .in("id", allIds);

    const byId = new Map(
      (players ?? []).map((p) => [
        p.id as string,
        p as {
          id: string;
          nombre: string;
          posicion: Position;
          equipo_real: string;
          photo_url: string | null;
          rareza: Player["rareza"];
        },
      ])
    );

    const toPreview = (
      id: string,
      role: "starter" | "bench"
    ): RivalLineupPlayer | null => {
      const p = byId.get(id);
      if (!p) return null;
      return {
        id: p.id,
        nombre: p.nombre,
        posicion: p.posicion,
        equipo_real: p.equipo_real,
        photo_url: p.photo_url,
        rareza: p.rareza,
        isCaptain: captainId === id,
        role,
        points: pointsByPlayerId.has(id)
          ? pointsByPlayerId.get(id)!
          : hasScoringData
            ? 0
            : null,
      };
    };

    starters = starterIds
      .map((id) => toPreview(id, "starter"))
      .filter(Boolean) as RivalLineupPlayer[];
    bench = benchIds
      .map((id) => toPreview(id, "bench"))
      .filter(Boolean) as RivalLineupPlayer[];
  }

  const wildCards: RivalWildCardPreview[] = (activeCards ?? []).map((row) => {
    const def = getWildCardDefinition(row.card_type as WildCardType);
    return {
      cardType: def.id,
      name: def.name,
      description: def.description,
    };
  });

  // Prefer formation derived from actual XI so pitch slots match players.
  let formation = storedFormation;
  if (starters.length === 11) {
    const result = validateFormation(
      starters.map((p) => ({
        id: p.id,
        api_football_id: null,
        nombre: p.nombre,
        equipo_real: p.equipo_real,
        posicion: p.posicion,
        rareza: p.rareza,
        costo_base: 0,
        photo_url: p.photo_url,
      }))
    );
    if (result.valid) formation = result.formation;
  }

  return {
    ...empty,
    source,
    locked: !!snapshot,
    formation: formation ?? "4-4-2",
    starters,
    bench,
    captainId,
    wildCards,
  };
});

async function resolvePreviewGameweek(
  admin: ReturnType<typeof createServiceRoleClient>,
  gameweekId?: string | null
): Promise<GameweekPublic | null> {
  if (gameweekId) {
    const { data: row } = await admin
      .from("gameweeks")
      .select(
        "id, season, round, tournament_phase, first_kickoff_at, last_kickoff_at, status"
      )
      .eq("id", gameweekId)
      .maybeSingle();
    if (row) {
      const now = new Date();
      return {
        id: row.id,
        season: row.season,
        round: row.round,
        tournamentPhase:
          row.tournament_phase ?? getActiveTournamentPhase(now),
        firstKickoffAt: row.first_kickoff_at,
        lastKickoffAt: row.last_kickoff_at,
        status: deriveGameweekStatus(
          row.first_kickoff_at,
          row.last_kickoff_at,
          now
        ),
      };
    }
  }

  // Same jornada as home VS points (live or last finished).
  return (await getPointsGameweek()) ?? (await getCurrentGameweek());
}

/** @deprecated Prefer getClubLineupPreview — kept for callers expecting rival-only. */
export const getRivalLineupPreview = cache(async function getRivalLineupPreview(
  rivalClubId: string,
  gameweekId?: string | null
): Promise<RivalLineupPreview | null> {
  const myClub = await getUserClub();
  if (!myClub || !rivalClubId || rivalClubId === myClub.id) return null;
  return getClubLineupPreview(rivalClubId, gameweekId);
});
