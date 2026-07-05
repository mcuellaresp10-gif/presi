"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "@/lib/pwa/install-prompt";

/** Captura beforeinstallprompt una sola vez a nivel global (no se pierde al re-render). */
export function PwaInstallCapture() {
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);

  return null;
}
