import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const metadata: Metadata = {
  title: "Política de privacidad — PRESI",
  description:
    "Cómo PRESI trata tus datos personales: cuenta, juego, terceros, derechos y eliminación de cuenta.",
  robots: { index: true, follow: true },
};

const UPDATED_AT = "17 de julio de 2026";
const CONTACT_EMAIL = "mikece9410@gmail.com";

export default function PrivacidadPage() {
  return (
    <main className="poster-bg poster-shards relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 pb-16">
        <header className="mb-10">
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm text-presi-sand/70 transition hover:text-presi-gold"
          >
            <BrandLogo size={28} />
            <span className="font-semibold tracking-wide">PRESI</span>
          </Link>
          <h1 className="text-display text-4xl text-presi-gold sm:text-5xl">
            Política de privacidad
          </h1>
          <p className="mt-3 text-sm text-presi-sand/70">
            Última actualización: {UPDATED_AT}
          </p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed text-presi-sand/90">
          <Section title="1. Responsable del tratamiento">
            <p>
              El responsable del tratamiento de los datos personales es{" "}
              <strong className="text-white">PRESI</strong>, operado por
              persona natural en Bogotá, Colombia.
            </p>
            <p className="mt-3">
              Contacto de privacidad y soporte:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-presi-gold underline-offset-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p className="mt-3">
              Esta política aplica al sitio web, la aplicación web progresiva
              (PWA) y las aplicaciones nativas de PRESI (Android e iOS) que
              cargan el servicio en{" "}
              <span className="text-white">presi.onrender.com</span>.
            </p>
          </Section>

          <Section title="2. Edad mínima">
            <p>
              PRESI está dirigido a personas de{" "}
              <strong className="text-white">13 años o más</strong>. No está
              dirigido a menores de 13 años. Si eres padre, madre o tutor y
              crees que un menor nos ha facilitado datos, escríbenos para
              solicitar su eliminación.
            </p>
          </Section>

          <Section title="3. Datos que recopilamos">
            <p>Podemos tratar las siguientes categorías de datos:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Cuenta:</strong> correo
                electrónico; contraseña (almacenada de forma cifrada/hash por
                nuestro proveedor de autenticación); o datos de identidad
                proporcionados si inicias sesión con Google (por ejemplo,
                email y nombre asociado a esa cuenta); identificador único de
                usuario.
              </li>
              <li>
                <strong className="text-white">Datos de juego:</strong> club
                (nombre, apodo, estilo, ciudad ficticia, configuración de
                escudo), gemas, presupuesto, plantilla, alineaciones,
                instalaciones, packs, wild cards, pertenencia a ligas, puntos
                y progreso de temporada/jornada.
              </li>
              <li>
                <strong className="text-white">Uso técnico:</strong> cookies o
                almacenamiento equivalente necesarios para mantener tu sesión;
                preferencias de interfaz en el dispositivo (por ejemplo,
                si ya viste un tour o descartaste un aviso de instalación);
                y registros técnicos habituales de servidor (que pueden
                incluir dirección IP y datos del navegador o dispositivo)
                generados por el hosting.
              </li>
            </ul>
            <p className="mt-3">
              No solicitamos número de teléfono, dirección postal, fecha de
              nacimiento ni documentos de identidad.
            </p>
          </Section>

          <Section title="4. Para qué usamos los datos">
            <ul className="list-disc space-y-2 pl-5">
              <li>Crear y autenticar tu cuenta.</li>
              <li>Prestar el servicio de fantasy (club, plantilla, ligas, ranking, tienda in-game).</li>
              <li>Mostrar información de juego a otros jugadores cuando corresponda (ver sección 5).</li>
              <li>Atender soporte y solicitudes sobre tus derechos.</li>
              <li>Mantener la seguridad, estabilidad y operación del servicio.</li>
              <li>Cumplir obligaciones legales aplicables.</li>
            </ul>
            <p className="mt-3">
              La base del tratamiento es, según el caso, la ejecución del
              servicio que solicitas (cuenta y juego), tu consentimiento cuando
              corresponda (por ejemplo, al usar Google para iniciar sesión) y
              el interés legítimo en operar y proteger la plataforma, de
              conformidad con la legislación colombiana de protección de
              datos (Ley 1581 de 2012 y normas complementarias).
            </p>
          </Section>

          <Section title="5. Visibilidad frente a otros jugadores">
            <p>
              En ranking, ligas y contextos competitivos, otros usuarios pueden
              ver el <strong className="text-white">nombre del club</strong>,
              el <strong className="text-white">escudo</strong> y resultados
              de juego asociados.{" "}
              <strong className="text-white">
                Tu correo electrónico no se muestra
              </strong>{" "}
              a otros jugadores.
            </p>
          </Section>

          <Section title="6. Cookies y almacenamiento local">
            <p>
              Usamos cookies (o mecanismos equivalentes del navegador) para la
              sesión de autenticación gestionada por Supabase. En el
              dispositivo también guardamos preferencias de interfaz en{" "}
              <code className="text-presi-gold/90">localStorage</code> (tours,
              avisos de instalación, sincronización de calendario de juego).
              No usamos cookies de publicidad ni de analítica de producto.
            </p>
          </Section>

          <Section title="7. Encargados y terceros">
            <p>
              Para operar PRESI compartimos o permitimos el tratamiento de
              datos con proveedores que actúan como encargados o como
              responsables independientes según su propio servicio:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Supabase:</strong> autenticación
                y base de datos del juego.
              </li>
              <li>
                <strong className="text-white">Render:</strong> alojamiento de
                la aplicación web; puede generar logs técnicos (incluida IP).
              </li>
              <li>
                <strong className="text-white">Google:</strong> si eliges
                “Continuar con Google”, Google trata datos de identidad según
                su política; también podemos cargar tipografías desde
                infraestructura de Google.
              </li>
              <li>
                <strong className="text-white">API-Football / api-sports:</strong>{" "}
                datos de partidos y jugadores reales de fútbol; no trata datos
                personales de usuarios de PRESI.
              </li>
            </ul>
            <p className="mt-3">
              Estos proveedores pueden tratar datos fuera de Colombia. Al usar
              PRESI aceptas ese tratamiento necesario para prestar el
              servicio.
            </p>
          </Section>

          <Section title="8. Lo que no hacemos hoy">
            <ul className="list-disc space-y-2 pl-5">
              <li>No vendemos tus datos personales.</li>
              <li>No mostramos publicidad de terceros en la app.</li>
              <li>
                No usamos herramientas de analítica de producto (tipo
                Mixpanel, Amplitude o Google Analytics de app) ni de
                seguimiento publicitario.
              </li>
              <li>No enviamos correos de marketing.</li>
              <li>
                No tenemos notificaciones push configuradas para usuarios
                finales en este momento.
              </li>
            </ul>
          </Section>

          <Section title="9. Gemas y compras">
            <p>
              Las gemas y otros elementos virtuales del juego son moneda o
              bienes <strong className="text-white">in-game</strong>. Hoy no
              procesamos pagos con tarjeta ni pasarelas propias.
            </p>
            <p className="mt-3">
              En el futuro podremos ofrecer compras dentro de la aplicación
              (por ejemplo, gemas) a través de Google Play y/o Apple. Si eso
              ocurre, actualizaremos esta política y el tratamiento de datos
              de pago lo realizarán esas plataformas según sus propias
              condiciones; PRESI no recibirá tu número completo de tarjeta.
            </p>
          </Section>

          <Section title="10. Conservación">
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa y sea
              necesario para prestar el servicio. Tras eliminar la cuenta,
              borraremos o anonimizaremos los datos personales asociados,
              salvo que debamos conservar algún registro por obligación legal
              o para resolver disputas.
            </p>
          </Section>

          <Section title="11. Tus derechos">
            <p>
              De acuerdo con la normativa colombiana de protección de datos,
              puedes solicitar el ejercicio de derechos de acceso,
              actualización, rectificación, supresión y revocatoria del
              consentimiento, cuando aplique, escribiendo a{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-presi-gold underline-offset-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              . Responderemos en un plazo razonable.
            </p>
          </Section>

          <Section title="12. Eliminación de cuenta">
            <p>
              Para eliminar tu cuenta y los datos de juego asociados (incluido
              el club vinculado), envía un correo a{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Eliminar%20cuenta%20PRESI`}
                className="font-medium text-presi-gold underline-offset-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              desde el mismo email de la cuenta, con el asunto “Eliminar
              cuenta PRESI”. Incluye, si lo tienes, el ID de soporte que
              aparece en tu perfil.
            </p>
            <p className="mt-3">
              Procesaremos la solicitud en un plazo máximo de{" "}
              <strong className="text-white">30 días</strong>, salvo
              impedimento legal. La eliminación es irreversible: perderás el
              club, plantilla, gemas y progreso.
            </p>
          </Section>

          <Section title="13. Seguridad">
            <p>
              Aplicamos medidas técnicas y organizativas razonables (acceso
              autenticado, transmisión cifrada vía HTTPS, control de acceso a
              la base de datos). Ningún sistema es 100 % seguro; te pedimos
              proteger tu contraseña y no compartir el acceso a tu cuenta.
            </p>
          </Section>

          <Section title="14. Cambios a esta política">
            <p>
              Podemos actualizar esta política cuando cambie el servicio o la
              ley. La versión vigente estará siempre en esta URL (
              <span className="text-white">/privacidad</span>) con la fecha de
              última actualización. Si los cambios son relevantes, podremos
              avisarte en la app o por otros medios razonables.
            </p>
          </Section>

          <Section title="15. Contacto">
            <p>
              Preguntas sobre privacidad o datos personales:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-presi-gold underline-offset-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </article>

        <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-presi-sand/50">
          <Link href="/login" className="text-presi-gold hover:underline">
            Volver al inicio de sesión
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-display mb-3 text-xl text-white">{title}</h2>
      {children}
    </section>
  );
}
