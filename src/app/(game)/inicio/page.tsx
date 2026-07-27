import { HomeDashboard } from "@/components/home/HomeDashboard";
import { GameweekBackgroundSync } from "@/components/home/GameweekBackgroundSync";
import { PlayerDiscoveryDock } from "@/components/home/PlayerDiscoveryDock";
import { VsStreakRewardModal } from "@/components/home/VsStreakRewardModal";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import { getContractsSummary } from "@/lib/actions/contracts";
import { getFacilitiesOverview } from "@/lib/actions/facilities";
import {
  getClubGameweekSummary,
  getClubsGameweekPoints,
} from "@/lib/actions/gameweek";
import { getGlobalRanking } from "@/lib/actions/leagues";
import { getRivalLineupPreview } from "@/lib/actions/rival-lineup";
import { getScoutingState } from "@/lib/actions/scouting";
import { getVsRivalryState } from "@/lib/actions/vs-rewards";
import { getNextScoutingDeadline } from "@/lib/game";
import type { EscudoConfig, Player } from "@/lib/game/types";

export default async function InicioPage() {
  const club = await requireOnboardingComplete();

  const [gwSummary, scouting, overview, contractsSummary, ranking, vsState] =
    await Promise.all([
      getClubGameweekSummary(),
      getScoutingState(),
      getFacilitiesOverview(),
      getContractsSummary(),
      getGlobalRanking(),
      getVsRivalryState(),
    ]);

  const seasonPoints =
    gwSummary?.seasonPoints ??
    ranking.find((r) => r.club_nombre === club.nombre)?.puntos ??
    0;

  const myIndex = ranking.findIndex((r) => r.club_nombre === club.nombre);
  const rivalEntry =
    myIndex > 0
      ? ranking[myIndex - 1]
      : ranking.length > 1
        ? ranking[1]
        : null;

  const pointsGameweek = gwSummary?.pointsGameweek ?? null;
  const pointsGameweekId = gwSummary?.gameweekId ?? null;

  const rivalGwPoints =
    pointsGameweekId && rivalEntry?.id
      ? (
          await getClubsGameweekPoints(pointsGameweekId, [rivalEntry.id])
        )[rivalEntry.id] ?? 0
      : 0;

  const rivalPreview = rivalEntry?.id
    ? await getRivalLineupPreview(rivalEntry.id)
    : null;

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

  const isLive = pointsGameweek?.status === "live";

  return (
    <>
      <HomeDashboard
        clubId={club.id}
        clubNombre={club.nombre}
        escudoConfig={club.escudo_config as EscudoConfig}
        seasonPoints={seasonPoints}
        gameweekPoints={gwSummary?.gameweekPoints ?? 0}
        gameweekId={pointsGameweekId}
        gameweekRound={pointsGameweek?.round ?? null}
        gameweekStatus={pointsGameweek?.status ?? null}
        deadlineAt={gwSummary?.deadlineAt ?? null}
        isLineupLocked={gwSummary?.isLineupLocked ?? false}
        hasValidDraft={gwSummary?.hasValidDraft ?? false}
        rivalClubId={rivalEntry?.id ?? null}
        rivalNombre={rivalEntry?.club_nombre ?? null}
        rivalPoints={rivalGwPoints}
        rivalEscudo={(rivalEntry?.escudo_config as EscudoConfig) ?? null}
        rivalLineupPreview={rivalPreview}
        contractsExpiringSoon={contractsSummary?.expiringSoon ?? 0}
        nextIncomeTickAt={overview?.nextIncomeTickAt ?? null}
        incomeIntervalHours={overview?.incomeIntervalHours ?? 6}
        incomePerTick={overview?.incomePerTick ?? 0}
        gemsPerTick={overview?.gemsPerTick ?? 0}
        pendingIncome={overview?.pendingIncome ?? 0}
        pendingGems={overview?.pendingGems ?? 0}
        pendingTicks={overview?.pendingTicks ?? 0}
        vsWinStreak={vsState?.streak ?? 0}
        vsStreakTarget={vsState?.streakTarget ?? 5}
        vsWinGems={vsState?.winGems ?? 40}
      />
      <PlayerDiscoveryDock state={scoutingState} />
      <GameweekBackgroundSync live={isLive} />
      {vsState?.pendingStreakReward ? (
        <VsStreakRewardModal reward={vsState.pendingStreakReward} />
      ) : null}
    </>
  );
}
