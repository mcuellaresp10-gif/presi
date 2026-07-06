"use client";

import { useEffect, useState } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafariInstallGuide } from "@/components/layout/SafariInstallGuide";
import { useToast } from "@/components/ui/use-toast";
import {
  clearDeferredInstallPrompt,
  detectInstallPlatform,
  getDeferredInstallPrompt,
  getInstallInstructions,
  isStandaloneDisplay,
  subscribeInstallPrompt,
  type InstallPlatform,
} from "@/lib/pwa/install-prompt";

export function InstallAppInstructions({
  compact = false,
  showNativeButton = true,
}: {
  compact?: boolean;
  showNativeButton?: boolean;
}) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [hasNative, setHasNative] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;
    setPlatform(detectInstallPlatform());
    const sync = () => setHasNative(Boolean(getDeferredInstallPrompt()));
    sync();
    return subscribeInstallPrompt(sync);
  }, []);

  if (isStandaloneDisplay()) {
    return (
      <p className={compact ? "text-xs text-white/60" : "text-sm text-white/70"}>
        PRESI ya está instalado en tu dispositivo.
      </p>
    );
  }

  if (!platform) return null;

  const instructions = getInstallInstructions(platform);

  async function copySiteUrl() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast({
        title: "Enlace copiado",
        description: "Pégalo en Safari para instalar.",
      });
    } catch {
      toast({ title: "Copia manualmente", description: window.location.origin });
    }
  }

  async function handleInstall() {
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
      setHasNative(false);
      if (outcome === "accepted") {
        toast({ title: "PRESI instalado", description: "Ábrelo desde tu inicio." });
      }
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className={compact ? "text-xs text-white/70" : "text-sm text-white/80"}>
      <p className="font-semibold text-presi-gold">{instructions.title}</p>

      {platform === "ios-safari" ? (
        <div className="mt-2">
          <SafariInstallGuide compact={compact} />
        </div>
      ) : (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {instructions.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {showNativeButton &&
        hasNative &&
        instructions.canUseNativePrompt ? (
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
      </div>
    </div>
  );
}
