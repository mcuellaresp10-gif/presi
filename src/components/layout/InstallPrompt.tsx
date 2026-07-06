"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Share, X, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  installPromptBottom,
  Z_INSTALL_PROMPT,
} from "@/lib/layout/bottom-dock";
import {
  clearDeferredInstallPrompt,
  detectInstallPlatform,
  getDeferredInstallPrompt,
  getInstallInstructions,
  isStandaloneDisplay,
  subscribeInstallPrompt,
  type InstallPlatform,
} from "@/lib/pwa/install-prompt";

const DISMISS_KEY = "presi_install_prompt_dismissed_at";
const DISMISS_DAYS = 14;

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const elapsedDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

export function InstallPrompt() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [mounted, setMounted] = useState(false);

  const stackAboveScouting = pathname === "/inicio";
  const bottomStyle = useMemo(
    () => ({ bottom: installPromptBottom(stackAboveScouting) }),
    [stackAboveScouting]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay() || recentlyDismissed()) return;

    setPlatform(detectInstallPlatform());
    setVisible(true);

    const sync = () => {
      setHasNativePrompt(Boolean(getDeferredInstallPrompt()));
    };

    sync();
    return subscribeInstallPrompt(sync);
  }, []);

  const instructions = useMemo(
    () => (platform ? getInstallInstructions(platform) : null),
    [platform]
  );

  if (!mounted || !visible || !platform || !instructions) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const showNativeButton =
    instructions.canUseNativePrompt && hasNativePrompt;

  const handleInstall = async () => {
    const prompt = getDeferredInstallPrompt();
    if (!prompt) {
      toast({
        title: instructions.title,
        description: instructions.steps[0],
      });
      return;
    }

    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      clearDeferredInstallPrompt();
      setHasNativePrompt(false);

      if (outcome === "accepted") {
        toast({ title: "PRESI instalado", description: "Ábrelo desde tu inicio." });
        setVisible(false);
      }
    } catch {
      toast({
        title: "Usa el menú del navegador",
        description: instructions.steps.join(" "),
      });
    } finally {
      setInstalling(false);
    }
  };

  async function copySiteUrl() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast({ title: "Enlace copiado", description: "Pégalo en Safari para instalar." });
    } catch {
      toast({ title: "Copia manualmente", description: window.location.origin });
    }
  }

  const panel = (
    <div
      className="fixed inset-x-3 mx-auto max-w-lg rounded-xl border border-presi-cyan/20 bg-presi-elevated p-4 text-white shadow-xl shadow-black/40 sm:inset-x-4"
      style={{ ...bottomStyle, zIndex: Z_INSTALL_PROMPT }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute right-3 top-3 text-white/50 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pr-6">
        <p className="text-sm font-medium text-presi-gold">{instructions.title}</p>

        {platform === "ios-safari" ? (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-white/80">
            Toca <Share className="mx-0.5 inline h-4 w-4" /> Compartir →{" "}
            <span className="font-semibold">Agregar a inicio</span>.
          </p>
        ) : (
          <ol className="mt-2 space-y-1 text-[11px] leading-snug text-white/75 sm:text-xs">
            {instructions.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {showNativeButton ? (
            <Button
              type="button"
              onClick={handleInstall}
              size="sm"
              disabled={installing}
            >
              <Download className="mr-1.5 h-4 w-4" />
              {installing ? "..." : "Instalar"}
            </Button>
          ) : null}

          {platform === "ios-chrome" ? (
            <Button type="button" onClick={copySiteUrl} size="sm" variant="outline">
              <Copy className="mr-1.5 h-4 w-4" />
              Copiar enlace
            </Button>
          ) : null}

          {!showNativeButton && platform !== "ios-chrome" ? (
            <p className="self-center text-[10px] text-white/45">
              Si no ves «Instalar», usa los pasos de arriba.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

/** Contenido reutilizable para el menú «Más». */
export function InstallAppInstructions({
  compact = false,
}: {
  compact?: boolean;
}) {
  const platform = detectInstallPlatform();
  const instructions = getInstallInstructions(platform);
  const hasNative = Boolean(getDeferredInstallPrompt());

  return (
    <div className={compact ? "text-xs text-white/70" : "text-sm text-white/80"}>
      <p className="font-semibold text-presi-gold">{instructions.title}</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {instructions.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {hasNative && instructions.canUseNativePrompt ? (
        <p className="mt-2 text-[11px] text-presi-cyan">
          También puedes usar el botón «Instalar» del banner en Inicio.
        </p>
      ) : null}
    </div>
  );
}
