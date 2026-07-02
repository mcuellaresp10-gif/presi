"use server";

import { revalidatePath } from "next/cache";
import { canAddPlayer } from "@/lib/game";
import {
  DEFAULT_LOAN_JORNADAS,
  generateLoanOffers,
  getNextLoanRefresh,
  isLoanMarketReady,
  LOAN_MARKET_REFRESH_MS,
  MAX_ACTIVE_LOANS,
  parseLoanOffers,
  type LoanOffer,
} from "@/lib/game/loan-market";
import {
  getWildCardPackTier,
  rollWildCardFromPack,
  WILD_CARD_PACK_TIERS,
  type WildCardPackTierId,
} from "@/lib/game/wild-card-packs";
import {
  canClaimWildCard,
  getWildCardDefinition,
  type WildCardType,
} from "@/lib/game/wild-cards";
import type { Player } from "@/lib/game/types";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";
import type {
  TiendaLoanOffer,
  TiendaState,
  TiendaWildCardPack,
} from "@/lib/tienda/types";

export type { TiendaLoanOffer, TiendaState, TiendaWildCardPack } from "@/lib/tienda/types";

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

async function getActiveLoanCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("club_roster")
    .select("player_id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("es_prestamo", true);

  if (error?.message?.includes("es_prestamo")) return 0;
  return count ?? 0;
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

async function ensureLoanMarketState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  roster: Player[]
) {
  const { data: initialState, error: selectError } = await supabase
    .from("loan_market_state")
    .select("*")
    .eq("club_id", clubId)
    .maybeSingle();

  if (selectError?.message?.includes("loan_market_state")) {
    return null;
  }

  const state = initialState;

  if (!state) {
    const refreshEn = getNextLoanRefresh().toISOString();
    const pool = await getAvailablePool(supabase, roster);
    const offers = generateLoanOffers(clubId, pool);
    const { data: created, error: insertError } = await supabase
      .from("loan_market_state")
      .insert({
        club_id: clubId,
        refresh_en: refreshEn,
        offers,
      })
      .select()
      .single();

    if (!insertError) return created;

    const { data: existing } = await supabase
      .from("loan_market_state")
      .select("*")
      .eq("club_id", clubId)
      .maybeSingle();
    return existing;
  }

  if (isLoanMarketReady(state.refresh_en)) {
    const pool = await getAvailablePool(supabase, roster);
    const offers = generateLoanOffers(clubId, pool);
    const refreshEn = getNextLoanRefresh().toISOString();
    const { data: updated } = await supabase
      .from("loan_market_state")
      .update({
        refresh_en: refreshEn,
        offers,
        updated_at: new Date().toISOString(),
      })
      .eq("club_id", clubId)
      .select()
      .single();
    return updated ?? state;
  }

  return state;
}

async function hydrateLoanOffers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offers: LoanOffer[]
): Promise<TiendaLoanOffer[]> {
  const playerIds = offers.map((o) => o.playerId);
  if (playerIds.length === 0) return [];

  const { data: players } = await supabase
    .from("players_master")
    .select("*")
    .in("id", playerIds);

  const byId = new Map(
    (players as Player[] | null)?.map((p) => [p.id, p]) ?? []
  );

  return offers.map((offer) => ({
    ...offer,
    player: byId.get(offer.playerId) ?? null,
  }));
}

function buildPackCatalog(
  availableTypes: WildCardType[]
): TiendaWildCardPack[] {
  return WILD_CARD_PACK_TIERS.map((tier) => {
    const claimCheck = canClaimWildCard(availableTypes, "free_sign");
    const canBuy = claimCheck.ok;
    return {
      id: tier.id,
      name: tier.name,
      description: tier.description,
      costGems: tier.costGems,
      color: tier.color,
      canBuy,
      blockedReason: canBuy ? null : claimCheck.reason,
    };
  });
}

export async function getTiendaState(): Promise<TiendaState | null> {
  const club = await getUserClub();
  if (!club) return null;

  const gemas = Number(club.gemas ?? 150);
  const fallback: TiendaState = {
    gemas,
    refreshEn: getNextLoanRefresh().toISOString(),
    refreshMs: LOAN_MARKET_REFRESH_MS,
    loanOffers: [],
    activeLoans: 0,
    maxActiveLoans: MAX_ACTIVE_LOANS,
    defaultLoanJornadas: DEFAULT_LOAN_JORNADAS,
    wildCardPacks: buildPackCatalog([]),
    wildCardInventoryCount: 0,
    loadError: null,
  };

  try {
    const supabase = await createClient();
    const roster = await getRosterPlayers(supabase, club.id);
    const activeLoans = await getActiveLoanCount(supabase, club.id);
    const availableWildCardTypes = await getAvailableWildCardTypes(
      supabase,
      club.id
    );

    let loanState;
    try {
      loanState = await ensureLoanMarketState(supabase, club.id, roster);
    } catch (error) {
      console.error("loan_market_state failed:", error);
      loanState = null;
    }

    const offers = parseLoanOffers(loanState?.offers ?? []);
    const loanOffers = await hydrateLoanOffers(supabase, offers);

    return {
      gemas,
      refreshEn: loanState?.refresh_en ?? fallback.refreshEn,
      refreshMs: LOAN_MARKET_REFRESH_MS,
      loanOffers,
      activeLoans,
      maxActiveLoans: MAX_ACTIVE_LOANS,
      defaultLoanJornadas: DEFAULT_LOAN_JORNADAS,
      wildCardPacks: buildPackCatalog(availableWildCardTypes),
      wildCardInventoryCount: availableWildCardTypes.length,
      loadError: loanState ? null : "Mercado de préstamos temporalmente no disponible.",
    };
  } catch (error) {
    console.error("getTiendaState failed:", error);
    return {
      ...fallback,
      loadError: "No se pudo cargar la tienda. Recarga la página.",
    };
  }
}

export async function signLoanPlayer(slotIndex: number) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  const roster = await getRosterPlayers(supabase, club.id);
  const activeLoans = await getActiveLoanCount(supabase, club.id);

  if (activeLoans >= MAX_ACTIVE_LOANS) {
    return { error: `Máximo ${MAX_ACTIVE_LOANS} préstamos activos.` };
  }

  const loanState = await ensureLoanMarketState(supabase, club.id, roster);
  if (!loanState) return { error: "Mercado de préstamos no disponible." };

  const offers = parseLoanOffers(loanState.offers);
  const offer = offers.find((o) => o.slotIndex === slotIndex);
  if (!offer) return { error: "Oferta no encontrada." };
  if (offer.claimed) return { error: "Esta oferta ya fue firmada." };

  const { data: player } = await supabase
    .from("players_master")
    .select("*")
    .eq("id", offer.playerId)
    .maybeSingle();

  if (!player) return { error: "Jugador no encontrado." };

  const addCheck = canAddPlayer(roster, player as Player);
  if (!addCheck.ok) return { error: addCheck.reason };

  const gemas = Number(club.gemas ?? 0);
  if (gemas < offer.costoGemas) {
    return { error: "Gemas insuficientes." };
  }

  const { error: rosterError } = await supabase.from("club_roster").insert({
    club_id: club.id,
    player_id: offer.playerId,
    es_titular: false,
    es_prestamo: true,
    prestamo_jornadas_restantes: offer.jornadasPrestamo,
    jornadas_restantes: 0,
    renovaciones: 0,
  });

  if (rosterError) return { error: rosterError.message };

  const updatedOffers = offers.map((o) =>
    o.slotIndex === slotIndex ? { ...o, claimed: true } : o
  );

  await supabase
    .from("clubs")
    .update({ gemas: gemas - offer.costoGemas })
    .eq("id", club.id);

  await supabase
    .from("loan_market_state")
    .update({
      offers: updatedOffers,
      updated_at: new Date().toISOString(),
    })
    .eq("club_id", club.id);

  revalidatePath("/tienda");
  revalidatePath("/plantilla");
  revalidatePath("/inicio");

  return { success: true, player };
}

export async function purchaseWildCardPack(tierId: WildCardPackTierId) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const tier = getWildCardPackTier(tierId);
  if (!tier) return { error: "Sobre no válido." };

  const supabase = await createClient();
  const availableTypes = await getAvailableWildCardTypes(supabase, club.id);
  const rolledType = rollWildCardFromPack(tierId);
  const claimCheck = canClaimWildCard(availableTypes, rolledType);
  if (!claimCheck.ok) return { error: claimCheck.reason };

  const gemas = Number(club.gemas ?? 0);
  if (gemas < tier.costGems) {
    return { error: "Gemas insuficientes." };
  }

  const { error: insertError } = await supabase.from("club_wild_cards").insert({
    club_id: club.id,
    card_type: rolledType,
    status: "available",
  });

  if (insertError) return { error: insertError.message };

  await supabase
    .from("clubs")
    .update({ gemas: gemas - tier.costGems })
    .eq("id", club.id);

  revalidatePath("/tienda");
  revalidatePath("/perfil");
  revalidatePath("/instalaciones");
  revalidatePath("/inicio");

  return {
    success: true,
    card: getWildCardDefinition(rolledType),
  };
}
