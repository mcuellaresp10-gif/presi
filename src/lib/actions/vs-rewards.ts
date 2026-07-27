"use server";

import { revalidatePath } from "next/cache";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";
import { VS_STREAK_TARGET, VS_WIN_GEMS } from "@/lib/game/vs-rewards";
import type { VsStreakRewardPayload } from "@/lib/gameweek/vs-settle";

export async function getVsRivalryState() {
  const club = await getUserClub();
  if (!club) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("clubs")
    .select("vs_win_streak, pending_vs_streak_reward, gemas")
    .eq("id", club.id)
    .maybeSingle();

  return {
    streak: Number(data?.vs_win_streak ?? 0),
    streakTarget: VS_STREAK_TARGET,
    winGems: VS_WIN_GEMS,
    gemas: Number(data?.gemas ?? club.gemas ?? 0),
    pendingStreakReward:
      (data?.pending_vs_streak_reward as VsStreakRewardPayload | null) ?? null,
  };
}

export async function dismissVsStreakReward() {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  await supabase
    .from("clubs")
    .update({ pending_vs_streak_reward: null })
    .eq("id", club.id);

  revalidatePath("/inicio");
  revalidatePath("/plantilla");
  revalidatePath("/tienda");
  return { ok: true as const };
}
