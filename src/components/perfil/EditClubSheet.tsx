"use client";

import { useEffect, useState } from "react";
import { ClubCreationWizard, type ClubCreationData } from "@/components/onboarding/ClubCreationWizard";
import type { ClubIdentity } from "@/components/onboarding/ClubIdentityStep";
import { CloseButton } from "@/components/ui/close-button";
import { updateClub } from "@/lib/actions/club";
import { normalizeEscudoConfig } from "@/lib/game/escudo-sanitize";
import type { ClubStyle } from "@/lib/game/escudo-presets";
import type { EscudoConfig } from "@/lib/game/types";
import { useRouter } from "next/navigation";

export function EditClubSheet({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: {
    nombre: string;
    apodo: string | null;
    ciudad_ficticia: string | null;
    estilo: string | null;
    escudo_config: EscudoConfig;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const identity: ClubIdentity = {
    nombre: initial.nombre,
    apodo: initial.apodo ?? "",
    ciudad: initial.ciudad_ficticia ?? "",
    estilo: (initial.estilo as ClubStyle) ?? "",
  };

  async function handleSubmit(data: ClubCreationData) {
    setLoading(true);
    setError(null);

    const result = await updateClub({
      nombre: data.identity.nombre,
      apodo: data.identity.apodo || undefined,
      ciudad_ficticia: data.identity.ciudad || undefined,
      estilo: data.identity.estilo || undefined,
      escudo_config: data.escudo,
    });

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[min(92dvh,100dvh)] w-full max-w-lg flex-col rounded-t-3xl border border-white/10 bg-presi-surface shadow-2xl safe-bottom">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-display text-sm text-presi-gold">Editar club</p>
          <CloseButton onClick={onClose} className="-mr-1" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <ClubCreationWizard
            mode="edit"
            embedded
            initialIdentity={identity}
            initialEscudo={normalizeEscudoConfig(initial.escudo_config)}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
          />
        </div>
      </aside>
    </div>
  );
}
