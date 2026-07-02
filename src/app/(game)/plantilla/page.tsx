import { redirect } from "next/navigation";
import { PlantillaClient } from "./PlantillaClient";
import {
  getLineupDraftForClub,
  getPlantillaLineupState,
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

  const lineupState = await getPlantillaLineupState();
  const draft = lineupState?.editingGameweek
    ? await getLineupDraftForClub(lineupState.editingGameweek.id)
    : null;

  return (
    <PlantillaClient
      players={data.players}
      usedBudget={data.usedBudget}
      totalBudget={data.totalBudget}
      remainingBudget={data.remainingBudget}
      gameweekRound={lineupState?.displayRound ?? null}
      editingGameweekRound={lineupState?.editingRound ?? null}
      deadlineAt={lineupState?.deadlineAt ?? null}
      isLineupLocked={lineupState?.isLineupLocked ?? true}
      initialStarterIds={draft?.starterIds ?? []}
      initialBenchIds={draft?.benchIds ?? []}
      initialCaptainId={draft?.captainId ?? null}
    />
  );
}
