import { HomeDashboard } from "@/components/home/HomeDashboard";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import { getContractsSummary } from "@/lib/actions/contracts";
import { getFacilitiesOverview } from "@/lib/actions/facilities";
import {
  getClubGameweekSummary,
  triggerGameweekSync,
} from "@/lib/actions/gameweek";
import { getGlobalRanking } from "@/lib/actions/leagues";
import { getScoutingState } from "@/lib/actions/scouting";
import { getNextScoutingDeadline } from "@/lib/game";
import type { EscudoConfig, Player } from "@/lib/game/types";

export default async function InicioPage() {
  const club = await requireOnboardingComplete();

  try {
    await triggerGameweekSync();
  } catch {
    // tablas Sprint 2 pueden no existir aún
  }

  const gwSummary = await getClubGameweekSummary();
  const scouting = await getScoutingState();
  const overview = await getFacilitiesOverview();
  const contractsSummary = await getContractsSummary();

  const seasonPoints =
    gwSummary?.seasonPoints ??
    (await getGlobalRanking()).find((r) => r.club_nombre === club.nombre)
      ?.puntos ??
    0;

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
        presupuesto: Number(club.presupuesto),
      };

  return (
    <HomeDashboard
      clubNombre={club.nombre}
      escudoConfig={club.escudo_config as EscudoConfig}
      presupuesto={Number(club.presupuesto)}
      seasonPoints={seasonPoints}
      gameweekPoints={gwSummary?.gameweekPoints ?? 0}
      gameweekRound={gwSummary?.gameweek?.round ?? null}
      gameweekId={gwSummary?.gameweekId ?? null}
      gameweekStatus={gwSummary?.gameweek?.status ?? null}
      deadlineAt={gwSummary?.gameweek?.firstKickoffAt ?? null}
      isLineupLocked={gwSummary?.isLineupLocked ?? false}
      hasValidDraft={gwSummary?.hasValidDraft ?? false}
      scoutingState={scoutingState}
      pendingIncome={overview?.pendingIncome ?? 0}
      pendingGems={overview?.pendingGems ?? 0}
      pendingTicks={overview?.pendingTicks ?? 0}
      incomePerTick={overview?.incomePerTick ?? 0}
      gemsPerTick={overview?.gemsPerTick ?? 2}
      incomeIntervalHours={overview?.incomeIntervalHours ?? 12}
      nextIncomeTickAt={overview?.nextIncomeTickAt ?? null}
      weeklyIncome={overview?.weeklyIncome ?? 0}
      weeklyGems={overview?.weeklyGems ?? 0}
      gymBonusPct={overview?.bonuses?.gym?.leagueBonusPct ?? 0}
      contractsExpiringSoon={contractsSummary?.expiringSoon ?? 0}
    />
  );
}
