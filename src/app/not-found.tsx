import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center poster-bg poster-shards p-6">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle>Página no encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/70">
            La ruta que buscas no existe en PRESI.
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-sm font-medium text-presi-cyan hover:underline"
          >
            Volver al inicio
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
