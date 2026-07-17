"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const CLUB_CHILD_TABLES = [
  "lineup_drafts",
  "lineup_snapshots",
  "club_gameweek_points",
  "contract_gameweek_log",
  "club_season_points",
  "league_memberships",
  "club_roster",
  "facilities",
  "welcome_pack_sessions",
  "scouting_packs",
  "academy_packs",
  "club_wild_cards",
  "loan_market_state",
] as const;

async function deleteClubData(
  admin: ReturnType<typeof createServiceRoleClient>,
  clubId: string
) {
  for (const table of CLUB_CHILD_TABLES) {
    const { error } = await admin.from(table).delete().eq("club_id", clubId);
    if (error) {
      throw new Error(`No se pudo borrar datos de ${table}: ${error.message}`);
    }
  }

  const { error: clubError } = await admin.from("clubs").delete().eq("id", clubId);
  if (clubError) {
    throw new Error(`No se pudo borrar el club: ${clubError.message}`);
  }
}

/**
 * Deletes the authenticated user's club data and auth account.
 * Required for Google Play / App Store account-deletion compliance.
 */
export async function deleteAccount(): Promise<
  { error: string } | { ok: true }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para eliminar tu cuenta." };
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return {
      error:
        "No se pudo completar la eliminación. Intenta más tarde o escribe a mikece9410@gmail.com.",
    };
  }

  try {
    const { data: club, error: clubLookupError } = await admin
      .from("clubs")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (clubLookupError) {
      throw new Error(clubLookupError.message);
    }

    if (club?.id) {
      await deleteClubData(admin, club.id as string);
    }

    // Avoid FK block if the user created private leagues
    await admin
      .from("leagues")
      .update({ created_by: null })
      .eq("created_by", user.id);

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(
      user.id
    );
    if (deleteUserError) {
      throw new Error(deleteUserError.message);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar la cuenta.";
    console.error("[deleteAccount]", message);
    return {
      error: `No se pudo eliminar la cuenta. Escribe a mikece9410@gmail.com. (${message})`,
    };
  }

  await supabase.auth.signOut();
  return { ok: true };
}
