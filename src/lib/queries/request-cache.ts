import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Dedup auth + club dentro del mismo request (layout + page). */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getUserClubCached = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return club;
});
