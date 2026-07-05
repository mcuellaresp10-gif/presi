import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { ToastContextProvider } from "@/components/ui/use-toast";
import { PwaInstallCapture } from "@/components/layout/PwaInstallCapture";

const displayFont = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PRESI — Fantasy Liga Colombiana",
  description:
    "Crea tu club, ficha jugadores y compite en ligas privadas de fantasy fútbol colombiano.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRESI",
  },
};

export const viewport: Viewport = {
  themeColor: "#070B18",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} poster-bg antialiased text-white`}
      >
        <ToastContextProvider>
          <PwaInstallCapture />
          {children}
        </ToastContextProvider>
      </body>
    </html>
  );
}
