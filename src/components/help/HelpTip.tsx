"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { CloseButton } from "@/components/ui/close-button";
import {
  getHelpSection,
  type HelpSectionId,
} from "@/lib/game/help-content";
import { cn } from "@/lib/utils";

export function HelpTip({
  sectionId,
  className,
  label,
}: {
  sectionId: HelpSectionId;
  className?: string;
  /** Accessible label override */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const section = getHelpSection(sectionId);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-presi-gold transition hover:bg-white/15 hover:text-presi-gold",
          className
        )}
        aria-label={label ?? `Ayuda: ${section.title}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 mx-4 mb-6 w-full max-w-md rounded-2xl border border-white/10 bg-presi-surface p-4 shadow-2xl sm:mb-0">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-display text-sm text-presi-gold">
                  {section.title}
                </p>
                <p className="mt-1.5 text-xs leading-snug text-white/70">
                  {section.summary}
                </p>
              </div>
              <CloseButton
                onClick={() => setOpen(false)}
                variant="inline"
                className="h-9 w-9"
                iconClassName="h-4 w-4"
              />
            </div>
            <Link
              href={`/ayuda#${section.id}`}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-presi-gold hover:underline"
            >
              Ver reglas completas
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
