import Link from "next/link";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { WildCardInventory } from "@/components/wild-cards/WildCardInventory";
import { getProfileSummary } from "@/lib/actions/profile";
import { getMyLeagues } from "@/lib/actions/leagues";
import { getWildCardInventory } from "@/lib/actions/wild-cards";
import { getClubRoster } from "@/lib/db/queries";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import { formatCompactMoney } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";

export default async function PerfilPage() {
  const club = await requireOnboardingComplete();
  const profile = await getProfileSummary();
  const leagues = await getMyLeagues();
  const wildCards = await getWildCardInventory();
  const rosterData = await getClubRoster();

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-presi-cyan via-teal-600 to-presi-bg text-white shadow-lg">
        <div className="px-5 pb-6 pt-5">
          <div className="flex items-start gap-4">
            <EscudoRenderer
              config={club.escudo_config as Parameters<
                typeof EscudoRenderer
              >[0]["config"]}
              size={64}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xl font-black uppercase tracking-wide">
                {profile.club?.nombre}
              </p>
              <p className="text-sm font-medium text-white/80">
                {profile.displayName}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/50">
                {profile.email}
              </p>
              {profile.club?.ciudad_ficticia && (
                <p className="mt-2 flex items-center gap-1 text-xs text-white/70">
                  <MapPin className="h-3 w-3" />
                  {profile.club.ciudad_ficticia}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-black/20 sm:grid-cols-4">
          <StatBlock
            label="Puntos temporada"
            value={profile.seasonPoints.toLocaleString("es-CO")}
          />
          <StatBlock
            label={
              profile.gameweekRound
                ? `Jornada ${profile.gameweekRound}`
                : "Esta jornada"
            }
            value={profile.gameweekPoints.toLocaleString("es-CO")}
          />
          <StatBlock
            label="Ranking global"
            value={profile.globalRank ? `#${profile.globalRank}` : "—"}
            sub={
              profile.globalTotal
                ? `de ${profile.globalTotal} clubes`
                : undefined
            }
          />
          <StatBlock
            label="Presupuesto"
            value={formatCompactMoney(profile.club?.presupuesto ?? 0)}
          />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
          Resumen del club
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <OverviewCard
            icon={Users}
            title="Plantilla"
            value={`${profile.squadSize}/${profile.maxSquad}`}
            description="Jugadores en tu squad"
            href="/plantilla"
          />
          <OverviewCard
            icon={Trophy}
            title="Ligas privadas"
            value={String(profile.leaguesCount)}
            description="Ligas en las que participas"
            href="/ligas"
          />
          <OverviewCard
            icon={BarChart3}
            title="Ranking"
            value={
              profile.globalRank
                ? `Puesto ${profile.globalRank}`
                : "Sin posición"
            }
            description="Clasificación global"
            href="/ranking"
          />
          <OverviewCard
            icon={Building2}
            title="Instalaciones"
            value="Ver"
            description="Mejora tu club"
            href="/instalaciones"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
          Wild Cards ({wildCards.length})
        </h2>
        <WildCardInventory
          cards={wildCards}
          rosterPlayers={rosterData?.players ?? []}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
          Mis ligas
        </h2>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/80">
          {leagues.length === 0 ? (
            <p className="px-4 py-6 text-sm text-white/50">
              Aún no estás en ninguna liga privada.{" "}
              <Link href="/ligas" className="font-medium text-presi-cyan">
                Crear o unirse
              </Link>
            </p>
          ) : (
            <ul>
              {leagues.map((league) => {
                if (!league || typeof league !== "object" || Array.isArray(league))
                  return null;
                const l = league as { id: string; nombre: string; tipo: string };
                return (
                  <li
                    key={l.id}
                    className="flex items-center justify-between border-t border-white/5 px-4 py-3 first:border-t-0"
                  >
                    <div>
                      <p className="font-semibold text-white">{l.nombre}</p>
                      <p className="text-xs capitalize text-white/50">
                        {l.tipo}
                      </p>
                    </div>
                    <Link
                      href="/ligas"
                      className="text-xs font-medium text-presi-cyan"
                    >
                      Ver
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/60 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-white/40">
          ID de soporte
        </p>
        <p className="font-mono text-sm text-white">{profile.userId}</p>
      </section>
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-black/15 px-4 py-3 text-center">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-white/60">
        {label}
      </p>
      {sub && <p className="mt-0.5 text-[9px] text-white/40">{sub}</p>}
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  title,
  value,
  description,
  href,
}: {
  icon: typeof Users;
  title: string;
  value: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/80 p-4 transition hover:border-presi-cyan/30 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
        <Icon className="h-5 w-5 text-presi-cyan" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
          {title}
        </p>
        <p className="font-bold text-white">{value}</p>
        <p className="text-xs text-white/50">{description}</p>
      </div>
    </Link>
  );
}
