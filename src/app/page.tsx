import { redirect } from "next/navigation";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const club = await getUserClub();

  if (!club) {
    redirect("/onboarding/crear-club");
  }

  if (!club.onboarding_completado) {
    redirect("/onboarding/sobres");
  }

  redirect("/inicio");
}
