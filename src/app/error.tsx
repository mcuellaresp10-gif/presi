"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 poster-bg poster-shards p-6">
      <h1 className="text-xl font-bold text-white">Algo salió mal</h1>
      <p className="max-w-md text-center text-sm text-white/70">
        {error.message || "Ocurrió un error inesperado."}
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Ir al inicio
        </Button>
      </div>
    </main>
  );
}
