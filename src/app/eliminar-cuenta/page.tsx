import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DeleteAccountControls } from "@/components/account/DeleteAccountControls";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Eliminar cuenta — PRESI",
  description:
    "Elimina tu cuenta de PRESI y los datos de juego asociados. Cumple el requisito de eliminación de cuenta de Google Play.",
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "mikece9410@gmail.com";

export default async function EliminarCuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="poster-bg poster-shards relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-lg px-4 py-10 pb-16">
        <Link
          href={user ? "/inicio" : "/login"}
          className="mb-6 inline-flex items-center gap-2 text-sm text-presi-sand/70 transition hover:text-presi-gold"
        >
          <BrandLogo size={28} />
          <span className="font-semibold tracking-wide">PRESI</span>
        </Link>

        <h1 className="text-display text-4xl text-presi-gold">
          Eliminar cuenta
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-presi-sand/80">
          Desde esta página puedes solicitar la eliminación completa de tu
          cuenta de PRESI y de los datos asociados (club, plantilla, gemas,
          progreso). No basta con cerrar sesión: la eliminación borra el
          acceso y los datos de juego.
        </p>

        <section className="mt-8 space-y-3 text-sm text-presi-sand/80">
          <h2 className="text-display text-lg text-white">Qué se elimina</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Cuenta de autenticación (email / Google)</li>
            <li>Club, escudo, presupuesto y gemas</li>
            <li>Plantilla, alineaciones e instalaciones</li>
            <li>Progreso en ligas, ranking y jornadas</li>
          </ul>
          <p className="text-xs text-presi-sand/60">
            El proceso se completa de inmediato al confirmarlo estando
            autenticado. Si no puedes entrar a la app, escribe a{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Eliminar%20cuenta%20PRESI`}
              className="text-presi-gold underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            y lo procesaremos en un máximo de 30 días.
          </p>
        </section>

        <div className="mt-8">
          {user ? (
            <DeleteAccountControls variant="page" />
          ) : (
            <div className="rounded-lg border border-white/10 bg-presi-surface/60 p-4">
              <p className="text-sm text-presi-sand/80">
                Para eliminar la cuenta desde la web, inicia sesión con la misma
                cuenta que usas en PRESI.
              </p>
              <Link
                href="/login?next=/eliminar-cuenta"
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-sm bg-gradient-to-r from-presi-gold to-presi-coral px-4 text-sm font-semibold text-presi-bg"
              >
                Iniciar sesión para eliminar
              </Link>
              <p className="mt-4 text-xs text-presi-sand/55">
                También puedes pedir la eliminación por correo a{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Eliminar%20cuenta%20PRESI`}
                  className="text-presi-gold underline-offset-2 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-presi-sand/50">
          <Link href="/privacidad#eliminar-cuenta" className="hover:text-presi-gold">
            Ver política de privacidad
          </Link>
        </p>
      </div>
    </main>
  );
}
