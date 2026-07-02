import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { getGlobalRanking } from "@/lib/actions/leagues";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import type { EscudoConfig } from "@/lib/game/types";

export default async function RankingPage() {
  const club = await requireOnboardingComplete();
  const ranking = await getGlobalRanking();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-andes-deep">Ranking global</h1>
        <p className="text-sm text-andes-deep/70">
          Top 20 clubes de la Liga Global PRESI
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-andes-deep/10 bg-white/80">
        <table className="w-full text-sm">
          <thead className="bg-andes-deep text-left text-white">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((entry) => {
              const isUserClub = entry.club_nombre === club.nombre;
              return (
                <tr
                  key={entry.id}
                  className={`border-t border-andes-deep/5 ${
                    isUserClub ? "bg-andes-gold/10" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-andes-gold">
                    {entry.posicion}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <EscudoRenderer
                        config={entry.escudo_config as EscudoConfig}
                        size={28}
                      />
                      <span className="font-medium">{entry.club_nombre}</span>
                      {isUserClub && (
                        <span className="text-xs text-andes-accent">(Tú)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {entry.puntos.toLocaleString("es-CO")}
                    {"gym_bonus_pct" in entry && entry.gym_bonus_pct ? (
                      <span className="ml-1 text-[10px] text-andes-accent">
                        (+{entry.gym_bonus_pct}%)
                      </span>
                    ) : "hinchas_bonus_pct" in entry && entry.hinchas_bonus_pct ? (
                      <span className="ml-1 text-[10px] text-andes-accent">
                        (+{entry.hinchas_bonus_pct}%)
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
