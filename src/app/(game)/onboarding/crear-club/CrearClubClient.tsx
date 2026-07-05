"use client";

import { useState } from "react";
import { EscudoPicker } from "@/components/escudo/EscudoPicker";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClub } from "@/lib/actions/club";
import type { EscudoConfig } from "@/lib/game/types";

export function CrearClubClient() {
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [escudo, setEscudo] = useState<EscudoConfig>({
    templateId: 1,
    primaryColor: "#070B18",
    secondaryColor: "#F5C518",
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
    <div className="mx-auto max-w-lg space-y-6">
      <OnboardingStepper current={2} />

      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-presi-surface/80 p-6 backdrop-blur">
        <div className="relative">
          <EscudoRenderer config={escudo} size={96} />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-presi-gold px-3 py-0.5 text-[10px] font-bold uppercase text-presi-bg">
            Preview
          </div>
        </div>
        {nombre ? (
          <p className="text-display text-xl text-presi-gold">{nombre}</p>
        ) : (
          <p className="text-sm text-white/40">Tu club aparecerá aquí</p>
        )}
      </div>

      <div className="card-poster rounded-xl bg-presi-surface/90 p-6">
        <h1 className="text-display text-2xl text-presi-gold">Funda tu club</h1>
        <p className="mt-1 text-sm text-white/60">
          Nombre, escudo y ciudad ficticia
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="nombre">Nombre del club</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Los Halcones FC"
              minLength={3}
              maxLength={30}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="ciudad">Ciudad ficticia (opcional)</Label>
            <Input
              id="ciudad"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej. Villa Andina"
              className="mt-1"
            />
          </div>

          <EscudoPicker value={escudo} onChange={setEscudo} />

          {error ? <p className="text-sm text-presi-red">{error}</p> : null}

          <Button type="submit" variant="cta" className="w-full" disabled={loading}>
            {loading ? "Creando club..." : "Crear club y abrir sobres"}
          </Button>
        </form>
      </div>
    </div>
  );
}
