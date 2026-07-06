import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { LiveBadge } from "@/components/ui/live-badge";
import { GameweekBackgroundSync } from "@/components/home/GameweekBackgroundSync";
import { getLeagueCalendar } from "@/lib/actions/calendar";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import {
  formatFixtureKickoff,
  formatGameweekRange,
  isFixtureFinished,
  isFixtureLive,
} from "@/lib/gameweek/format";
import { cn } from "@/lib/utils";

function fixtureScore(home: number | null, away: number | null): string | null {
  if (home == null || away == null) return null;
  return `${home} – ${away}`;
}

export default async function CalendarioPage() {
  await requireOnboardingComplete();
  const { leagueName, season, tournamentLabel, gameweeks } =
    await getLeagueCalendar();

  const defaultOpenRound =
    gameweeks.find((gw) => gw.status === "live" || gw.status === "upcoming")
      ?.round ?? gameweeks[0]?.round;

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Calendario"
        subtitle={`${leagueName} · ${tournamentLabel} ${season}`}
      />

      {gameweeks.length === 0 ? (
        <EmptyState
          title="Calendario no disponible"
          description="Aún no hay jornadas cargadas. Vuelve en unos minutos mientras sincronizamos los partidos."
        />
      ) : (
        <div className="space-y-3">
          {gameweeks.map((gameweek) => {
            const isDefaultOpen = gameweek.round === defaultOpenRound;
            return (
              <details
                key={gameweek.id}
                open={isDefaultOpen}
                className="group rounded-xl border border-white/10 bg-presi-surface/60"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <p className="text-display text-base text-presi-gold">
                      Jornada {gameweek.round}
                    </p>
                    <p className="text-xs text-white/50">
                      {formatGameweekRange(
                        gameweek.firstKickoffAt,
                        gameweek.lastKickoffAt
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <LiveBadge
                      live={gameweek.status === "live"}
                      label={gameweek.statusLabel}
                      className={cn(
                        gameweek.status === "upcoming" &&
                          "bg-presi-gold/20 text-presi-gold",
                        gameweek.status === "finished" &&
                          "bg-white/10 text-white/50"
                      )}
                    />
                    <span className="text-white/40 transition group-open:rotate-180">
                      ▾
                    </span>
                  </div>
                </summary>

                {gameweek.fixtures.length === 0 ? (
                  <p className="border-t border-white/10 px-4 py-3 text-sm text-white/40">
                    Partidos pendientes de sincronizar.
                  </p>
                ) : (
                  <ul className="divide-y divide-white/10 border-t border-white/10">
                    {gameweek.fixtures.map((fixture) => {
                      const score = fixtureScore(
                        fixture.homeGoals,
                        fixture.awayGoals
                      );
                      const finished = isFixtureFinished(fixture.status);
                      const live = isFixtureLive(fixture.status);

                      return (
                        <li key={fixture.id}>
                          <SurfaceCard className="rounded-none border-0 bg-transparent px-4 py-3 shadow-none">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1 text-right">
                                <p className="truncate text-sm font-semibold text-white">
                                  {fixture.homeTeam}
                                </p>
                              </div>

                              <div className="flex w-[5.5rem] shrink-0 flex-col items-center gap-0.5">
                                {finished && score ? (
                                  <p className="text-sm font-black tabular-nums text-presi-gold">
                                    {score}
                                  </p>
                                ) : live ? (
                                  <LiveBadge live label="Vivo" />
                                ) : (
                                  <p className="text-[10px] font-bold uppercase text-white/40">
                                    vs
                                  </p>
                                )}
                                <p className="text-center text-[10px] text-white/45">
                                  {formatFixtureKickoff(fixture.kickoffAt)}
                                </p>
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                  {fixture.awayTeam}
                                </p>
                              </div>
                            </div>
                          </SurfaceCard>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </details>
            );
          })}
        </div>
      )}

      <GameweekBackgroundSync />
    </div>
  );
}
