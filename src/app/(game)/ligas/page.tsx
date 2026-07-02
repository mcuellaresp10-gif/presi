import { CreateLeagueForm } from "./CreateLeagueForm";
import { getMyLeagues } from "@/lib/actions/leagues";
import { requireOnboardingComplete } from "@/lib/auth/guards";

export default async function LigasPage() {
  await requireOnboardingComplete();
  const leagues = await getMyLeagues();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-andes-deep">Ligas</h1>
        <p className="text-sm text-andes-deep/70">
          Crea una liga privada e invita amigos
        </p>
      </div>

      <CreateLeagueForm />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-andes-deep">
          Mis ligas
        </h2>
        {leagues.length === 0 ? (
          <p className="text-sm text-andes-deep/50">
            Aún no estás en ninguna liga privada.
          </p>
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
                <li
                  key={l.id}
                  className="rounded-lg border border-andes-deep/10 bg-white/80 p-4"
                >
                  <p className="font-medium text-andes-deep">{l.nombre}</p>
                  <p className="text-xs text-andes-deep/60">
                    {l.tipo === "privada" ? "Privada" : "Global"}
                    {l.codigo_invitacion
                      ? ` · Código: ${l.codigo_invitacion}`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
