"use client";

/** Guía visual: el botón Compartir está en Safari, no dentro de PRESI. */
export function SafariInstallGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p
        className={
          compact
            ? "text-[11px] leading-snug text-white/75"
            : "text-sm leading-snug text-white/80"
        }
      >
        El botón <span className="font-semibold text-white">Compartir</span>{" "}
        <span className="text-presi-gold">no está dentro de PRESI</span> — está
        en la barra de Safari, abajo en la pantalla.
      </p>

      <div
        className="overflow-hidden rounded-lg border border-white/15 bg-black/40"
        aria-hidden
      >
        <div
          className={
            compact ? "h-8 bg-presi-bg/80" : "h-12 bg-presi-bg/80"
          }
        />
        <div className="flex items-center justify-between border-t border-white/20 bg-[#1c1c1e] px-3 py-2">
          <div className="flex gap-3 opacity-30">
            <span className="text-lg leading-none">‹</span>
            <span className="text-lg leading-none">›</span>
          </div>
          <div
            className={
              compact
                ? "flex flex-col items-center rounded-md bg-presi-gold/25 px-3 py-1 ring-2 ring-presi-gold"
                : "flex flex-col items-center rounded-md bg-presi-gold/25 px-4 py-1.5 ring-2 ring-presi-gold"
            }
          >
            <svg
              viewBox="0 0 24 24"
              className={compact ? "h-4 w-4 text-presi-gold" : "h-5 w-5 text-presi-gold"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span
              className={
                compact
                  ? "text-[9px] font-bold text-presi-gold"
                  : "text-[10px] font-bold text-presi-gold"
              }
            >
              Compartir
            </span>
          </div>
          <div className="flex gap-1 opacity-30">
            <span
              className={
                compact
                  ? "h-4 w-4 rounded-sm border border-white/40"
                  : "h-5 w-5 rounded-sm border border-white/40"
              }
            />
            <span
              className={
                compact
                  ? "h-4 w-4 rounded-full border border-white/40"
                  : "h-5 w-5 rounded-full border border-white/40"
              }
            />
          </div>
        </div>
      </div>

      <ol
        className={
          compact
            ? "list-inside list-decimal space-y-1 text-[11px] text-white/70"
            : "list-inside list-decimal space-y-1.5 text-sm text-white/75"
        }
      >
        <li>
          Toca <span className="font-semibold text-white">Compartir</span> en la
          barra de Safari (centro-abajo).
        </li>
        <li>
          Elige{" "}
          <span className="font-semibold text-white">Agregar a inicio</span>.
        </li>
        <li>Confirma con «Agregar».</li>
      </ol>

      <p
        className={
          compact
            ? "text-[10px] text-white/45"
            : "text-xs text-white/50"
        }
      >
        ¿No ves la barra? Desliza hacia abajo en la página o toca la barra de
        direcciones arriba para que aparezca.
      </p>
    </div>
  );
}
