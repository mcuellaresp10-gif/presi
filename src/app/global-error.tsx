"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-presi-bg p-6 font-sans text-white">
        <h1 className="text-display text-2xl text-presi-gold">Error en PRESI</h1>
        <p className="max-w-md text-center text-sm text-white/70">
          {error.message || "Error crítico de la aplicación."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-sm bg-presi-gold px-4 py-2 text-sm font-semibold text-presi-bg"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
