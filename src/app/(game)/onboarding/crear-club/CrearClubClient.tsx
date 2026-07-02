"use client";

import { useState } from "react";
import { EscudoPicker } from "@/components/escudo/EscudoPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClub } from "@/lib/actions/club";
import type { EscudoConfig } from "@/lib/game/types";

export function CrearClubClient() {
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [escudo, setEscudo] = useState<EscudoConfig>({
    templateId: 1,
    primaryColor: "#1B2A4A",
    secondaryColor: "#C9A227",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createClub({
      nombre,
      escudo_config: escudo,
      ciudad_ficticia: ciudad || undefined,
    });

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Funda tu club</CardTitle>
          <p className="text-sm text-andes-deep/70">
            Elige nombre, escudo y ciudad ficticia
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="nombre">Nombre del club</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Atlético Cumbre"
                minLength={3}
                maxLength={30}
                required
              />
            </div>

            <div>
              <Label htmlFor="ciudad">Ciudad ficticia (opcional)</Label>
              <Input
                id="ciudad"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej. Villa Andina"
              />
            </div>

            <EscudoPicker value={escudo} onChange={setEscudo} />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando club..." : "Crear club y abrir sobres"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
