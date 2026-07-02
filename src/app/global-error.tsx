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
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F4EFE4] p-6 font-sans text-[#1B2A4A]">
        <h1 className="text-xl font-bold">Error en PRESI</h1>
        <p className="max-w-md text-center text-sm opacity-70">
          {error.message || "Error crítico de la aplicación."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-[#C9A227] px-4 py-2 text-sm font-medium text-[#1B2A4A]"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
