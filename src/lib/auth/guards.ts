import { redirect } from "next/navigation";
import { getUserClub } from "@/lib/actions/club";

export async function requireAuthClub() {
  const club = await getUserClub();
  if (!club) {
    redirect("/onboarding/crear-club");
  }
  return club;
}

export async function requireOnboardingComplete() {
  const club = await requireAuthClub();
  if (!club.onboarding_completado) {
    redirect("/onboarding/sobres");
  }
  return club;
}

export async function requireNoClub() {
  const club = await getUserClub();
  if (club?.onboarding_completado) {
    redirect("/inicio");
  }
  if (club) {
    redirect("/onboarding/sobres");
  }
}

export async function requireSobresPending() {
  const club = await getUserClub();
  if (!club) {
    redirect("/onboarding/crear-club");
  }
  if (club.onboarding_completado) {
    redirect("/inicio");
  }
  return club;
}
