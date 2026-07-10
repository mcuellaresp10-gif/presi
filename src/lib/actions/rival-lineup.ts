"use server";

import { cache } from "react";
import { getUserClub } from "@/lib/actions/club";
import { getCurrentGameweek, getEditableGameweek } from "@/lib/actions/gameweek";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getWildCardDefinition } from "@/lib/game/wild-cards";
import type { WildCardType } from "@/lib/game/wild-cards";
import type { EscudoConfig, Player, Position } from "@/lib/game/types";

export type RivalLineupPlayer = {
  id: string;
  nombre: string;
  posicion: Position;
  equipo_real: string;
  photo_url: string | null;
  rareza: Player["rareza"];
  isCaptain: boolean;
  role: "starter" | "bench";
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
  starters: RivalLineupPlayer[];
  bench: RivalLineupPlayer[];
  captainId: string | null;
  wildCards: RivalWildCardPreview[];
};

export const getRivalLineupPreview = cache(async function getRivalLineupPreview(
  rivalClubId: string
): Promise<RivalLineupPreview | null> {
  const myClub = await getUserClub();
  if (!myClub || !rivalClubId || rivalClubId === myClub.id) return null;

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return null;
  }

  const [editable, current] = await Promise.all([
    getEditableGameweek(),
    getCurrentGameweek(),
  ]);
  const gameweek = current?.status === "live" ? current : (editable ?? current);

  const { data: rivalClub } = await admin
    .from("clubs")
    .select("id, nombre, escudo_config, onboarding_completado")
    .eq("id", rivalClubId)
    .maybeSingle();

  if (!rivalClub?.onboarding_completado) return null;

  const empty: RivalLineupPreview = {
    clubId: rivalClub.id,
    clubNombre: rivalClub.nombre,
    escudoConfig: (rivalClub.escudo_config as EscudoConfig) ?? null,
    gameweekRound: gameweek?.round ?? null,
    source: "none",
    locked: false,
    starters: [],
    bench: [],
    captainId: null,
    wildCards: [],
  };

  if (!gameweek) return empty;

  const [{ data: snapshot }, { data: draft }, { data: activeCards }] =
    await Promise.all([
      admin
        .from("lineup_snapshots")
        .select("starter_ids, bench_ids, captain_id, is_valid")
        .eq("club_id", rivalClubId)
        .eq("gameweek_id", gameweek.id)
        .maybeSingle(),
      admin
        .from("lineup_drafts")
        .select("starter_ids, bench_ids, captain_id")
        .eq("club_id", rivalClubId)
        .eq("gameweek_id", gameweek.id)
        .maybeSingle(),
      admin
        .from("club_wild_cards")
        .select("card_type")
        .eq("club_id", rivalClubId)
        .eq("gameweek_id", gameweek.id)
        .eq("status", "active"),
    ]);

  const lineup = snapshot ?? draft;
  const source: RivalLineupPreview["source"] = snapshot
    ? "snapshot"
    : draft
      ? "draft"
      : "none";

  const starterIds = ((lineup?.starter_ids as string[]) ?? []).filter(Boolean);
  const benchIds = ((lineup?.bench_ids as string[]) ?? []).filter(Boolean);
  const captainId = (lineup?.captain_id as string | null) ?? null;
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

  return {
    ...empty,
    source,
    locked: !!snapshot,
    starters,
    bench,
    captainId,
    wildCards,
  };
});
