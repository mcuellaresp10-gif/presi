"use client";

import { useState } from "react";
import { ClubCreationWizard } from "@/components/onboarding/ClubCreationWizard";
import { createClub } from "@/lib/actions/club";

export function CrearClubClient() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <ClubCreationWizard
      loading={loading}
      error={error}
      onSubmit={async ({ identity, escudo }) => {
        setLoading(true);
        setError(null);

        const result = await createClub({
          nombre: identity.nombre,
          apodo: identity.apodo || undefined,
          ciudad_ficticia: identity.ciudad || undefined,
          estilo: identity.estilo || undefined,
          escudo_config: escudo,
        });

        if (result && "error" in result && result.error) {
          setError(result.error);
          setLoading(false);
        }
      }}
    />
  );
}
