import { redirect } from "next/navigation";
import { GameweekBackgroundSync } from "@/components/home/GameweekBackgroundSync";
import { PlantillaClient } from "./PlantillaClient";
import {
  getLineupDraftForClub,
  getPlantillaLineupState,
} from "@/lib/actions/gameweek";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import { getClubRoster } from "@/lib/db/queries";

export default async function PlantillaPage() {
  await requireOnboardingComplete();

  const data = await getClubRoster();

  if (!data) {
    redirect("/onboarding/crear-club");
  }

  const lineupState = await getPlantillaLineupState();
  const draft = lineupState?.editingGameweek
    ? await getLineupDraftForClub(lineupState.editingGameweek.id)
    : null;

  return (
    <>
      <PlantillaClient
      players={data.players}
      usedBudget={data.usedBudget}
      totalBudget={data.totalBudget}
      remainingBudget={data.remainingBudget}
      gameweekRound={lineupState?.displayRound ?? null}
      editingGameweekRound={lineupState?.editingRound ?? null}
      deadlineAt={lineupState?.deadlineAt ?? null}
      isLineupLocked={lineupState?.isLineupLocked ?? false}
      initialStarterIds={draft?.starterIds ?? []}
      initialBenchIds={draft?.benchIds ?? []}
      initialCaptainId={draft?.captainId ?? null}
      initialFormation={draft?.formation ?? "4-4-2"}
    />
      <GameweekBackgroundSync />
    </>
  );
}
