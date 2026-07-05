"use client";

import { useEffect, useState } from "react";
import { Share, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "presi_install_prompt_dismissed_at";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS expone esta propiedad no estándar
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const elapsedDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    if (isIos()) {
      setPlatform("ios");
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !platform) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 rounded-xl border border-presi-cyan/20 bg-presi-elevated p-4 text-white shadow-xl shadow-black/40 safe-bottom">
      <button
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
          </div>
          <Button onClick={handleAndroidInstall} size="sm" className="shrink-0">
            <Download className="mr-1.5 h-4 w-4" />
            Instalar
          </Button>
        </div>
      )}
    </div>
  );
}
