import { redirect } from "next/navigation";
import { FacilitiesClient } from "./FacilitiesClient";
import { getAcademyState } from "@/lib/actions/academy";
import { getFacilitiesOverview } from "@/lib/actions/facilities";
import { getScoutingState } from "@/lib/actions/scouting";
import { getWildCardInventory } from "@/lib/actions/wild-cards";
import { getClubRoster } from "@/lib/db/queries";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import { getNextScoutingDeadline } from "@/lib/game";
import type { Player } from "@/lib/game/types";

export default async function InstalacionesPage() {
  await requireOnboardingComplete();
  const overview = await getFacilitiesOverview();
  const scouting = await getScoutingState();
  const academy = await getAcademyState();
  const wildCards = await getWildCardInventory();
  const rosterData = await getClubRoster();

  if (!overview) {
    redirect("/onboarding/crear-club");
  }

  const scoutingState = scouting?.pack
    ? {
        estado: scouting.pack.estado as "timer" | "listo" | "reclamado",
        generaEn: scouting.pack.genera_en,
        player: scouting.player as Player | null,
        wildCardType: scouting.wildCardType ?? null,
        scoutingNivel: scouting.scoutingNivel,
        wildCardChancePct: scouting.wildCardChancePct,
        presupuesto: scouting.presupuesto,
      }
    : {
        estado: "timer" as const,
        generaEn: getNextScoutingDeadline(1).toISOString(),
        player: null,
        wildCardType: null,
        scoutingNivel: 1,
        presupuesto: overview.presupuesto,
      };

  const academyState = academy?.pack
    ? {
        estado: academy.pack.estado as "timer" | "listo" | "reclamado",
        generaEn: academy.pack.genera_en,
        player: academy.player as Player | null,
        academyNivel: academy.academyNivel,
        presupuesto: academy.presupuesto,
      }
    : {
        estado: "timer" as const,
        generaEn: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        player: null,
        academyNivel: 1,
        presupuesto: overview.presupuesto,
      };

  return (
    <FacilitiesClient
      facilities={overview.facilities}
      scoutingState={scoutingState}
      academyState={academyState}
      presupuesto={overview.presupuesto}
      pendingIncome={overview.pendingIncome}
      pendingGems={overview.pendingGems}
      pendingTicks={overview.pendingTicks}
      incomePerTick={overview.incomePerTick}
      gemsPerTick={overview.gemsPerTick}
      incomeIntervalHours={overview.incomeIntervalHours}
      nextIncomeTickAt={overview.nextIncomeTickAt}
      weeklyIncome={overview.weeklyIncome}
      weeklyGems={overview.weeklyGems}
      activeUpgradesCount={overview.activeUpgradesCount}
      upgradeInfo={overview.upgradeInfo}
      wildCards={wildCards}
      rosterPlayers={rosterData?.players ?? []}
    />
  );
}
