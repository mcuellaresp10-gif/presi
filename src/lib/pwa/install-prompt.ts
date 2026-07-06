export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPlatform =
  | "ios-safari"
  | "ios-chrome"
  | "android"
  | "desktop-chrome"
  | "desktop-other";

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

export function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function isChromeIos() {
  if (typeof window === "undefined") return false;
  return isIosDevice() && /crios/i.test(window.navigator.userAgent);
}

export function isSafariBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (isIosDevice()) {
    return /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  }
  return /safari/i.test(ua) && !/chrome|crios|edg/i.test(ua);
}

export function isAndroidDevice() {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent);
}

export function isDesktopDevice() {
  if (typeof window === "undefined") return false;
  return !isIosDevice() && !isAndroidDevice();
}

export function isChromiumDesktop() {
  if (typeof window === "undefined") return false;
  if (!isDesktopDevice()) return false;
  const ua = window.navigator.userAgent;
  return /chrome|edg/i.test(ua) && !/fxios/i.test(ua);
}

export function detectInstallPlatform(): InstallPlatform {
  if (isIosDevice()) {
    return isSafariBrowser() ? "ios-safari" : "ios-chrome";
  }
  if (isAndroidDevice()) return "android";
  if (isChromiumDesktop()) return "desktop-chrome";
  return "desktop-other";
}

export function getInstallInstructions(platform: InstallPlatform): {
  title: string;
  steps: string[];
  canUseNativePrompt: boolean;
} {
  switch (platform) {
    case "ios-safari":
      return {
        title: "Instala PRESI en tu iPhone",
        steps: [
          "Busca Compartir en la barra de Safari (abajo, centro).",
          "Elige «Agregar a inicio».",
          "Confirma con «Agregar».",
        ],
        canUseNativePrompt: false,
      };
    case "ios-chrome":
      return {
        title: "En iPhone usa Safari",
        steps: [
          "Chrome en iPhone no permite instalar apps web.",
          "Copia el enlace y ábrelo en Safari.",
          "En Safari: Compartir → «Agregar a inicio».",
        ],
        canUseNativePrompt: false,
      };
    case "android":
      return {
        title: "Instala PRESI",
        steps: [
          "Pulsa «Instalar» abajo, o",
          "Menú ⋮ → «Instalar app» / «Agregar a inicio».",
        ],
        canUseNativePrompt: true,
      };
    case "desktop-chrome":
      return {
        title: "Instala PRESI en tu PC",
        steps: [
          "Menú ⋮ (arriba a la derecha) → «Instalar PRESI…»",
          "O busca el icono ⊕ en la barra de direcciones.",
          "También: ⋮ → «Guardar y compartir» → «Instalar».",
        ],
        canUseNativePrompt: true,
      };
    default:
      return {
        title: "Instala PRESI",
        steps: [
          "Busca «Instalar aplicación» en el menú del navegador.",
          "En Edge: menú ⋮ → Aplicaciones → Instalar este sitio.",
        ],
        canUseNativePrompt: Boolean(getDeferredInstallPrompt()),
      };
  }
}

/** @deprecated use isIosDevice + isSafariBrowser */
export function isIosSafari() {
  return isIosDevice() && isSafariBrowser();
}

export function isChromiumBrowser() {
  return isChromiumDesktop() || isChromeIos() || isAndroidDevice();
}

export function getManualInstallHint(): string {
  return getInstallInstructions(detectInstallPlatform()).steps.join(" ");
}
