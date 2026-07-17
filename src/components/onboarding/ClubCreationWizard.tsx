"use client";

import { useState } from "react";
import { EscudoStudio } from "@/components/escudo/EscudoStudio";
import {
  ClubConfirmStep,
} from "@/components/onboarding/ClubConfirmStep";
import {
  ClubIdentityStep,
  type ClubIdentity,
} from "@/components/onboarding/ClubIdentityStep";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { Button } from "@/components/ui/button";
import { DEFAULT_ESCUDO } from "@/lib/game/escudo-presets";
import type { EscudoConfig } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export type ClubCreationData = {
  identity: ClubIdentity;
  escudo: EscudoConfig;
};

const EMPTY_IDENTITY: ClubIdentity = {
  nombre: "",
  apodo: "",
  ciudad: "",
  estilo: "",
};

export function ClubCreationWizard({
  mode = "create",
  initialIdentity = EMPTY_IDENTITY,
  initialEscudo = DEFAULT_ESCUDO,
  loading = false,
  error = null,
  embedded = false,
  onSubmit,
}: {
  mode?: "create" | "edit";
  initialIdentity?: ClubIdentity;
  initialEscudo?: EscudoConfig;
  loading?: boolean;
  error?: string | null;
  embedded?: boolean;
  onSubmit: (data: ClubCreationData) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identity, setIdentity] = useState<ClubIdentity>(initialIdentity);
  const [escudo, setEscudo] = useState<EscudoConfig>(initialEscudo);

  const titles: Record<1 | 2 | 3, { title: string; subtitle: string }> = {
    1: {
      title: mode === "create" ? "Crea tu club" : "Identidad del club",
      subtitle: "Nombre, apodo y ciudad",
    },
    2: {
      title: "Diseña tu escudo",
      subtitle: "Forma, símbolo y colores",
    },
    3: {
      title: mode === "create" ? "Confirmar" : "Guardar cambios",
      subtitle: "Revisa antes de continuar",
    },
  };

  return (
    <div className={cn("mx-auto max-w-lg space-y-6", !embedded && "px-4")}>
      <OnboardingStepper current={step} variant="club-wizard" />

      <div
        className={cn(
          !embedded && "card-poster rounded-xl bg-presi-surface/90 p-6"
        )}
      >
        <h1 className="text-display text-2xl text-presi-gold">
          {titles[step].title}
        </h1>
        <p className="mt-1 text-sm text-white/60">{titles[step].subtitle}</p>

        <div className="mt-6">
          {step === 1 && (
            <ClubIdentityStep
              value={identity}
              onChange={setIdentity}
              onContinue={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <div className="space-y-4">
              <EscudoStudio
                value={escudo}
                onChange={setEscudo}
                clubName={identity.nombre}
                clubApodo={identity.apodo}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Atrás
                </Button>
                <Button
                  type="button"
                  variant="cta"
                  className="flex-1"
                  onClick={() => setStep(3)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <ClubConfirmStep
              identity={identity}
              escudo={escudo}
              loading={loading}
              error={error}
              onSubmit={() => onSubmit({ identity, escudo })}
              onEditEscudo={() => setStep(2)}
              onBack={() => setStep(1)}
              submitLabel={
                mode === "create" ? "Fundar club y abrir sobres" : "Guardar cambios"
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
