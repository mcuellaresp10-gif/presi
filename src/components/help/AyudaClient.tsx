"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { HelpSectionBody } from "@/components/help/HelpSectionBody";
import {
  HELP_SECTIONS,
  isHelpSectionId,
} from "@/lib/game/help-content";
import { requestHowToTourReplay } from "@/lib/help/tour-storage";

export function AyudaClient() {
  useEffect(() => {
    const scrollToHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw || !isHelpSectionId(raw)) return;
      const el = document.getElementById(raw);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    if (section && isHelpSectionId(section) && !window.location.hash) {
      window.history.replaceState(null, "", `/ayuda#${section}`);
    }

    // Wait a tick for layout
    const t = window.setTimeout(scrollToHash, 50);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Cómo se juega"
        subtitle="Reglas completas de PRESI"
        action={
          <Button
            type="button"
            variant="outline"
            className="min-h-[40px] text-xs"
            onClick={() => requestHowToTourReplay()}
          >
            Ver tour
          </Button>
        }
      />

      <nav
        aria-label="Índice de reglas"
        className="sticky top-[3.25rem] z-10 -mx-1 flex gap-2 overflow-x-auto bg-presi-elevated/90 px-1 py-2 backdrop-blur-md"
      >
        {HELP_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-presi-gold/40 hover:text-presi-gold"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {HELP_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-28 border-t border-white/10 pt-5"
          >
            <h2 className="text-display text-lg text-presi-gold">
              {section.title}
            </h2>
            <p className="mt-2 text-xs leading-snug text-white/50">
              {section.summary}
            </p>
            <HelpSectionBody section={section} className="mt-4" />
          </section>
        ))}
      </div>

      <p className="text-center text-[11px] text-white/40">
        ¿Dudas? Revisa también{" "}
        <Link href="/plantilla" className="text-presi-gold hover:underline">
          Plantilla
        </Link>{" "}
        e{" "}
        <Link
          href="/instalaciones"
          className="text-presi-gold hover:underline"
        >
          Instalaciones
        </Link>
        .
      </p>
    </div>
  );
}
