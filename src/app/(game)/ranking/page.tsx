import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getGlobalRanking } from "@/lib/actions/leagues";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import type { EscudoConfig } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function rankMedal(pos: number): string | null {
  if (pos === 1) return "🥇";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return null;
}

export default async function RankingPage() {
  const club = await requireOnboardingComplete();
  const ranking = await getGlobalRanking();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ranking global"
        subtitle="Todos los clubes activos, ordenados por puntos de temporada"
      />

      {ranking.length === 0 ? (
        <EmptyState
          title="Sin clubes en el ranking"
          description="Sé el primero en sumar puntos esta temporada."
        />
      ) : (
        <ul className="space-y-2">
          {ranking.map((entry) => {
            const isUserClub = entry.club_nombre === club.nombre;
            const medal = rankMedal(entry.posicion);
            return (
              <li key={entry.id}>
                <SurfaceCard
                  className={cn(
                    "flex items-center gap-3 py-3",
                    isUserClub && "border-presi-cyan/40 bg-presi-cyan/5"
                  )}
                >
                  <div className="flex w-10 shrink-0 flex-col items-center">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="text-display text-lg text-presi-gold">
                        {entry.posicion}
                      </span>
                    )}
                  </div>
                  <EscudoRenderer
                    config={entry.escudo_config as EscudoConfig}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {entry.club_nombre}
                      {isUserClub ? (
                        <span className="ml-1 text-xs text-presi-cyan">
                          (Tú)
                        </span>
                      ) : null}
                    </p>
                    {entry.gym_bonus_pct ? (
                      <p className="text-[10px] text-presi-cyan">
                        +{entry.gym_bonus_pct}% gimnasio
                      </p>
                    ) : null}
                  </div>
                  <p className="text-lg font-black tabular-nums text-presi-gold">
                    {entry.puntos.toLocaleString("es-CO")}
                  </p>
                </SurfaceCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
