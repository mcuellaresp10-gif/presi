import Link from "next/link";
import { PerfilClubHeader } from "@/components/perfil/PerfilClubHeader";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { SurfaceCard } from "@/components/ui/surface-card";
import { WildCardInventory } from "@/components/wild-cards/WildCardInventory";
import { getProfileSummary } from "@/lib/actions/profile";
import { getMyLeagues } from "@/lib/actions/leagues";
import { getWildCardInventory } from "@/lib/actions/wild-cards";
import { getClubRoster } from "@/lib/db/queries";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import type { EscudoConfig } from "@/lib/game/types";
import { formatCompactMoney } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  Gem,
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
    <div className="space-y-6">
      <PageHeader title="Mi perfil" subtitle={profile.email} />

      <SurfaceCard className="overflow-hidden p-0">
        <PerfilClubHeader
          club={{
            nombre: club.nombre,
            apodo: (club as { apodo?: string | null }).apodo ?? null,
            estilo: (club as { estilo?: string | null }).estilo ?? null,
            ciudad_ficticia: club.ciudad_ficticia,
            escudo_config: club.escudo_config as EscudoConfig,
          }}
          displayName={profile.displayName}
        />

        <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4">
          <StatBlock
            label="Temporada"
            value={profile.seasonPoints.toLocaleString("es-CO")}
          />
          <StatBlock
            label={
              profile.gameweekRound
                ? `J${profile.gameweekRound}`
                : "Jornada"
            }
            value={profile.gameweekPoints.toLocaleString("es-CO")}
          />
          <StatBlock
            label="Ranking"
            value={profile.globalRank ? `#${profile.globalRank}` : "—"}
          />
          <StatBlock
            label="Gemas"
            value={String(profile.gemas)}
          />
        </div>
      </SurfaceCard>

      <section>
        <SectionLabel className="mb-3">Accesos rápidos</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2">
          <OverviewCard
            icon={Users}
            title="Plantilla"
            value={`${profile.squadSize}/${profile.maxSquad}`}
            href="/plantilla"
          />
          <OverviewCard
            icon={Trophy}
            title="Ligas"
            value={String(profile.leaguesCount)}
            href="/ligas"
          />
          <OverviewCard
            icon={BarChart3}
            title="Ranking"
            value={profile.globalRank ? `#${profile.globalRank}` : "—"}
            href="/ranking"
          />
          <OverviewCard
            icon={Building2}
            title="Instalaciones"
            value="Ver"
            href="/instalaciones"
          />
        </div>
      </section>

      <section>
        <SectionLabel className="mb-3">
          Wild Cards ({wildCards.length})
        </SectionLabel>
        <WildCardInventory
          cards={wildCards}
          rosterPlayers={rosterData?.players ?? []}
        />
      </section>

      <section>
        <SectionLabel className="mb-3">Presupuesto</SectionLabel>
        <SurfaceCard className="flex items-center gap-3">
          <Gem className="h-5 w-5 text-presi-gold" />
          <div>
            <p className="text-sm text-white/50">Disponible</p>
            <p className="text-lg font-bold text-presi-cyan">
              {formatCompactMoney(profile.club?.presupuesto ?? 0)}
            </p>
          </div>
        </SurfaceCard>
      </section>

      {leagues.length > 0 ? (
        <section>
          <SectionLabel className="mb-3">Mis ligas</SectionLabel>
          <ul className="space-y-2">
            {leagues.map((league) => {
              if (!league || typeof league !== "object" || Array.isArray(league))
                return null;
              const l = league as { id: string; nombre: string; tipo: string };
              return (
                <li key={l.id}>
                  <SurfaceCard className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold">{l.nombre}</p>
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
                  </SurfaceCard>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <SurfaceCard className="py-3">
        <p className="text-[10px] uppercase tracking-wider text-white/40">
          ID de soporte
        </p>
        <p className="font-mono text-sm text-white/70">{profile.userId}</p>
      </SurfaceCard>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-presi-surface px-3 py-3 text-center">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-white/40">
        {label}
      </p>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  title,
  value,
  href,
}: {
  icon: typeof Users;
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <SurfaceCard className="flex items-center gap-3 py-3 transition hover:border-presi-cyan/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-presi-elevated">
          <Icon className="h-5 w-5 text-presi-cyan" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            {title}
          </p>
          <p className="font-bold text-white">{value}</p>
        </div>
      </SurfaceCard>
    </Link>
  );
}
