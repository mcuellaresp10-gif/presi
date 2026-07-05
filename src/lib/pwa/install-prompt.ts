export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function captureInstallPrompt(event: Event) {
  event.preventDefault();
  deferredInstallPrompt = event as BeforeInstallPromptEvent;
  listeners.forEach((listener) => listener());
}

export function getDeferredInstallPrompt() {
  return deferredInstallPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredInstallPrompt = null;
}

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}

export function isIosSafari() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function isChromiumBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /chrome|crios|edg/i.test(ua) && !/fxios/i.test(ua);
}

export function getManualInstallHint(): string {
  if (isIosSafari()) {
    return "Toca Compartir y luego «Agregar a inicio».";
  }
  if (/android/i.test(navigator.userAgent)) {
    return "Menú ⋮ → «Instalar app» o «Agregar a pantalla de inicio».";
  }
  return "Menú ⋮ (arriba a la derecha) → «Instalar PRESI» o «Save and share» → Install.";
}
