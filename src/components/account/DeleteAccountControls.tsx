"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";

export function DeleteAccountControls({
  variant = "menu",
}: {
  variant?: "menu" | "page";
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.location.assign("/login?deleted=1");
    });
  }

  if (!confirmOpen) {
    if (variant === "menu") {
      return (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-red-300/90 transition hover:bg-red-500/10"
        >
          <Trash2 className="h-5 w-5 shrink-0" />
          Eliminar cuenta
        </button>
      );
    }

    return (
      <Button
        type="button"
        variant="destructive"
        className="w-full sm:w-auto"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar mi cuenta
      </Button>
    );
  }

  return (
    <div
      className={
        variant === "menu"
          ? "mx-1 mb-2 rounded-lg border border-red-400/40 bg-red-500/10 p-3"
          : "rounded-lg border border-red-400/40 bg-red-500/10 p-4"
      }
    >
      <p className="text-sm font-semibold text-red-200">
        ¿Eliminar tu cuenta de forma permanente?
      </p>
      <p className="mt-2 text-xs leading-relaxed text-white/70">
        Se borrarán tu cuenta, email de acceso, club, plantilla, gemas, ligas
        asociadas a tu progreso y demás datos de juego. Esta acción no se puede
        deshacer.
      </p>
      {error ? (
        <p className="mt-2 text-xs text-presi-coral">{error}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={handleDelete}
          className="w-full sm:flex-1"
        >
          {pending ? "Eliminando..." : "Sí, eliminar definitivamente"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setConfirmOpen(false);
            setError(null);
          }}
          className="w-full sm:flex-1"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
