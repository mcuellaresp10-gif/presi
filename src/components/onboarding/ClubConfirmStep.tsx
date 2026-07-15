"use client";

import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import type { ClubIdentity } from "@/components/onboarding/ClubIdentityStep";
import { Button } from "@/components/ui/button";
import type { EscudoConfig } from "@/lib/game/types";

export function ClubConfirmStep({
  identity,
  escudo,
  loading,
  error,
  onSubmit,
  onEditEscudo,
  onBack,
  submitLabel = "Fundar club",
}: {
  identity: ClubIdentity;
  escudo: EscudoConfig;
  loading?: boolean;
  error?: string | null;
  onSubmit: () => void;
  onEditEscudo: () => void;
  onBack: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-presi-gold/20 bg-gradient-to-b from-presi-navy/80 to-presi-surface p-8 text-center">
        <EscudoRenderer config={escudo} size={160} />
        <div>
          <p className="text-display text-2xl text-presi-gold">
            {identity.nombre}
          </p>
          {identity.apodo ? (
            <p className="mt-1 text-sm font-bold uppercase tracking-widest text-presi-gold">
              {identity.apodo}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-white/60">
          {identity.ciudad ? <span>{identity.ciudad}</span> : null}
          {identity.ciudad && identity.estilo ? (
            <span className="text-white/30">·</span>
          ) : null}
          {identity.estilo ? <span>{identity.estilo}</span> : null}
        </div>
      </div>

      <p className="text-center text-sm text-white/60">
        Recibirás <span className="font-semibold text-presi-gold">4 sobres</span>{" "}
        de bienvenida para armar tu plantilla.
      </p>

      {error ? <p className="text-center text-sm text-presi-red">{error}</p> : null}

      <Button
        type="button"
        variant="cta"
        className="w-full"
        disabled={loading}
        onClick={onSubmit}
      >
        {loading ? "Creando club..." : submitLabel}
      </Button>

      <div className="flex flex-col gap-2 text-center text-xs">
        <button
          type="button"
          onClick={onEditEscudo}
          className="font-semibold text-presi-gold hover:underline"
        >
          Volver a editar escudo
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-white/50 hover:text-white/80"
        >
          Cambiar identidad del club
        </button>
      </div>
    </div>
  );
}
