"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseButton } from "@/components/ui/close-button";
import { Button } from "@/components/ui/button";
import {
  getHelpSection,
  HOWTO_TOUR_STEPS,
} from "@/lib/game/help-content";
import {
  hasSeenHowToTour,
  HOWTO_TOUR_EVENT,
  markHowToTourSeen,
} from "@/lib/help/tour-storage";

export function HowToPlayTour() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const openTour = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    markHowToTourSeen();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/onboarding")) return;

    const onReplay = () => openTour();
    window.addEventListener(HOWTO_TOUR_EVENT, onReplay);

    if (pathname === "/inicio" && !hasSeenHowToTour()) {
      const t = window.setTimeout(() => openTour(), 400);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener(HOWTO_TOUR_EVENT, onReplay);
      };
    }

    return () => window.removeEventListener(HOWTO_TOUR_EVENT, onReplay);
  }, [pathname, openTour]);

  if (!open) return null;

  const sectionId = HOWTO_TOUR_STEPS[step];
  const section = getHelpSection(sectionId);
  const isLast = step >= HOWTO_TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar tour"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
      />

      <div
        role="dialog"
        aria-labelledby="howto-tour-title"
        className="relative z-10 mx-4 mb-6 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-presi-surface shadow-2xl sm:mb-0"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Cómo se juega · {step + 1}/{HOWTO_TOUR_STEPS.length}
          </p>
          <CloseButton
            onClick={dismiss}
            variant="inline"
            className="h-9 w-9"
            iconClassName="h-4 w-4"
            label="Saltar tour"
          />
        </div>

        <div className="px-4 py-5">
          <h2
            id="howto-tour-title"
            className="text-display text-xl text-presi-gold"
          >
            {section.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            {section.summary}
          </p>

          <div className="mt-4 flex gap-1.5">
            {HOWTO_TOUR_STEPS.map((id, i) => (
              <span
                key={id}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-presi-cyan" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={dismiss}
            className="min-h-[44px] text-sm text-white/50 hover:text-white/80"
          >
            Ahora no
          </button>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] flex-1 sm:flex-none"
                onClick={() => setStep((s) => s - 1)}
              >
                Atrás
              </Button>
            ) : null}
            {isLast ? (
              <>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/ayuda" onClick={dismiss}>
                    Ver ayuda
                  </Link>
                </Button>
                <Button asChild variant="cta" className="min-h-[44px] flex-1">
                  <Link href="/plantilla" onClick={dismiss}>
                    Armar alineación
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="cta"
                className="min-h-[44px] flex-1 sm:flex-none"
                onClick={() => setStep((s) => s + 1)}
              >
                Siguiente
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
