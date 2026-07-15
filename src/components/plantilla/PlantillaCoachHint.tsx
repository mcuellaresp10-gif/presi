"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { CloseButton } from "@/components/ui/close-button";

const STORAGE_KEY = "presi_plantilla_coach_seen";

export function PlantillaCoachHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-presi-gold"
        aria-label="Ayuda de plantilla"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-presi-gold/20 bg-presi-gold/10 px-3 py-2 text-[11px] text-white/80">
      <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-presi-gold" />
      <p className="flex-1 leading-snug">
        Arrastra jugadores al campo o banca. Toca una carta para ver detalles y
        mover entre titular, banca o reserva.
      </p>
      <CloseButton
        onClick={dismiss}
        variant="inline"
        className="h-9 w-9"
        iconClassName="h-4 w-4"
      />
    </div>
  );
}
