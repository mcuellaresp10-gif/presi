"use client";

import { useEffect, useState } from "react";
import { Share, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  getManualInstallHint,
  isChromiumBrowser,
  isIosSafari,
  isStandaloneDisplay,
  subscribeInstallPrompt,
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
  const { toast } = useToast();
  const [platform, setPlatform] = useState<"ios" | "installable" | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay() || recentlyDismissed()) return;

    if (isIosSafari()) {
      setPlatform("ios");
      setVisible(true);
      return;
    }

    const sync = () => {
      if (getDeferredInstallPrompt()) {
        setPlatform("installable");
        setVisible(true);
      }
    };

    sync();
    return subscribeInstallPrompt(sync);
  }, []);

  if (!visible || !platform) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    const prompt = getDeferredInstallPrompt();
    if (!prompt) {
      toast({
        title: "Instala manualmente",
        description: getManualInstallHint(),
      });
      return;
    }

    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      clearDeferredInstallPrompt();

      if (outcome === "accepted") {
        toast({ title: "PRESI instalado", description: "Ábrelo desde tu inicio." });
        setVisible(false);
      } else {
        toast({
          title: "Instalación cancelada",
          description: getManualInstallHint(),
        });
      }
    } catch {
      toast({
        title: "Usa el menú de Chrome",
        description: getManualInstallHint(),
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 rounded-xl border border-presi-cyan/20 bg-presi-elevated p-4 text-white shadow-xl shadow-black/40 safe-bottom">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute right-3 top-3 text-white/50 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      {platform === "ios" ? (
        <div className="pr-6">
          <p className="text-sm font-medium text-presi-gold">
            Instala PRESI en tu iPhone
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-white/80">
            Toca <Share className="mx-1 inline h-4 w-4" /> Compartir, y luego{" "}
            <span className="font-semibold">Agregar a inicio</span>.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 pr-6">
          <div>
            <p className="text-sm font-medium text-presi-gold">
              Instala PRESI
            </p>
            <p className="text-sm text-white/80">
              Ábrelo como app, sin el navegador de por medio.
            </p>
            {isChromiumBrowser() && !getDeferredInstallPrompt() ? (
              <p className="mt-1 text-[11px] text-white/50">
                Si el botón no responde: {getManualInstallHint()}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            onClick={handleInstall}
            size="sm"
            className="shrink-0"
            disabled={installing}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {installing ? "..." : "Instalar"}
          </Button>
        </div>
      )}
    </div>
  );
}
