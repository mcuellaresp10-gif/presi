import Link from "next/link";
import { CreateLeagueForm } from "./CreateLeagueForm";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getMyLeagues } from "@/lib/actions/leagues";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import { Trophy } from "lucide-react";

export default async function LigasPage() {
  await requireOnboardingComplete();
  const leagues = await getMyLeagues();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ligas"
        subtitle="Crea una liga privada e invita amigos"
        action={
          <Link
            href="/ligas/unirse"
            className="text-xs font-semibold text-presi-cyan hover:underline"
          >
            Unirse
          </Link>
        }
      />

      <CreateLeagueForm />

      <section>
        <SectionLabel className="mb-3">Mis ligas</SectionLabel>
        {leagues.length === 0 ? (
          <EmptyState
            title="Sin ligas privadas"
            description="Crea una liga o únete con un código de invitación."
            actionLabel="Unirse a liga"
            actionHref="/ligas/unirse"
            icon={<Trophy className="h-10 w-10" />}
          />
        ) : (
          <ul className="space-y-2">
            {leagues.map((league) => {
              if (!league || typeof league !== "object" || Array.isArray(league))
                return null;
              const l = league as unknown as {
                id: string;
                nombre: string;
                tipo: string;
                codigo_invitacion: string | null;
              };
              return (
                <li key={l.id}>
                  <SurfaceCard>
                    <p className="font-semibold text-white">{l.nombre}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {l.tipo === "privada" ? "Privada" : "Global"}
                      {l.codigo_invitacion ? (
                        <>
                          {" "}
                          · Código:{" "}
                          <span className="font-mono text-presi-gold">
                            {l.codigo_invitacion}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </SurfaceCard>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
