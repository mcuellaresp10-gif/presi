import { redirect } from "next/navigation";
import { TiendaClient } from "./TiendaClient";
import { getTiendaState } from "@/lib/actions/tienda";
import { requireOnboardingComplete } from "@/lib/auth/guards";

export default async function TiendaPage() {
  await requireOnboardingComplete();
  const state = await getTiendaState();

  if (!state) {
    redirect("/onboarding/crear-club");
  }

  return <TiendaClient initialState={state} />;
}
