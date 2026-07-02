import { redirect } from "next/navigation";
import { PlantillaClient } from "./PlantillaClient";
import {
  getClubGameweekSummary,
  getLineupDraftForClub,
  getCurrentGameweek,
  triggerGameweekSync,
} from "@/lib/actions/gameweek";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import { getClubRoster } from "@/lib/db/queries";

export default async function PlantillaPage() {
  await requireOnboardingComplete();

  try {
    await triggerGameweekSync();
  } catch {
    // sync opcional si faltan tablas migradas
  }

  const data = await getClubRoster();

  if (!data) {
    redirect("/onboarding/crear-club");
  }

  const gameweek = await getCurrentGameweek();
  const summary = await getClubGameweekSummary();
  const draft = gameweek
    ? await getLineupDraftForClub(gameweek.id)
    : null;

  return (
    <PlantillaClient
      players={data.players}
      usedBudget={data.usedBudget}
      totalBudget={data.totalBudget}
      remainingBudget={data.remainingBudget}
      gameweekRound={gameweek?.round ?? null}
      deadlineAt={gameweek?.firstKickoffAt ?? null}
      isLineupLocked={summary?.isLineupLocked ?? false}
      initialStarterIds={draft?.starterIds ?? []}
      initialBenchIds={draft?.benchIds ?? []}
      initialCaptainId={draft?.captainId ?? null}
    />
  );
}
