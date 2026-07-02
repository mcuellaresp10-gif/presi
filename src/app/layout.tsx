import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { ToastContextProvider } from "@/components/ui/use-toast";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

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
  title: "PRESI — Fantasy Liga BetPlay",
  description:
    "Crea tu club, ficha jugadores y compite en ligas privadas de fantasy fútbol colombiano.",
  manifest: "/manifest.json",
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
        className={`${geistSans.variable} ${displayFont.variable} ${bodyFont.variable} poster-bg antialiased text-white`}
      >
        <ToastContextProvider>{children}</ToastContextProvider>
      </body>
    </html>
  );
}
