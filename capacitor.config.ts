import type { CapacitorConfig } from "@capacitor/cli";

/**
 * PRESI Capacitor shell.
 *
 * Local Android emulator (default): http://10.0.2.2:3000
 * App Store / Codemagic / production:
 *   CAPACITOR_SERVER_URL=https://tu-app.onrender.com
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "http://10.0.2.2:3000";
const isHttps = serverUrl.startsWith("https://");

const config: CapacitorConfig = {
  appId: "lat.presi.app",
  appName: "PRESI",
  webDir: "out",
  server: {
    url: serverUrl,
    cleartext: !isHttps,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
