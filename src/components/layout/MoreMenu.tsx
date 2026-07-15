"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Copy,
  Download,
  LogOut,
  Sparkles,
  Smartphone,
  Trophy,
  User,
} from "lucide-react";
import { CloseButton } from "@/components/ui/close-button";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import type { ProfileSummary } from "@/lib/actions/profile";
import { InstallAppInstructions } from "@/components/layout/InstallAppInstructions";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { isStandaloneDisplay } from "@/lib/pwa/install-prompt";
import { requestHowToTourReplay } from "@/lib/help/tour-storage";

const MORE_ITEMS = [
  { href: "/ayuda", label: "Cómo se juega", icon: BookOpen },
  { href: "/ligas", label: "Mis ligas", icon: Trophy },
  { href: "/calendario", label: "Calendario Liga Colombiana", icon: CalendarDays },
  { href: "/ranking", label: "Ranking global", icon: BarChart3 },
  { href: "/perfil", label: "Mi perfil", icon: User },
] as const;

export function MoreMenu({
  profile,
  open,
  onClose,
}: {
  profile: ProfileSummary;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const showInstallEntry = !isStandaloneDisplay();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function copyUserId() {
    await navigator.clipboard.writeText(profile.userId);
    setCopied(true);
    toast({ title: "ID copiado" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Cerrar menú"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-presi-surface text-white shadow-2xl safe-bottom">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-display text-sm text-presi-gold">Más</p>
          <CloseButton onClick={onClose} label="Cerrar menú" className="-mr-1" />
        </div>

        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          {profile.club ? (
            <EscudoRenderer config={profile.club.escudo_config} size={48} />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{profile.club?.nombre}</p>
            <p className="text-xs text-white/50">{profile.displayName}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
              >
                <Icon className="h-5 w-5 shrink-0 text-presi-gold/70" />
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              onClose();
              requestHowToTourReplay();
            }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
          >
            <Sparkles className="h-5 w-5 shrink-0 text-presi-gold/70" />
            Repetir tour
          </button>

          {showInstallEntry ? (
            <button
              type="button"
              onClick={() => setInstallOpen((open) => !open)}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
            >
              <Smartphone className="h-5 w-5 shrink-0 text-presi-gold/70" />
              Instalar app
              <Download className="ml-auto h-4 w-4 text-white/40" />
            </button>
          ) : null}

          <form action="/auth/signout" method="post" className="mt-2 px-1">
            <button
              type="submit"
              className="flex min-h-[44px] w-full items-center gap-3 rounded-lg border border-presi-coral/50 bg-presi-coral/20 px-3 py-3 text-sm font-semibold text-presi-coral transition hover:bg-presi-coral/30"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {showInstallEntry && installOpen ? "Instalar PRESI" : "App"}
          </p>
          {showInstallEntry && installOpen ? (
            <InstallAppInstructions compact showNativeButton />
          ) : showInstallEntry ? (
            <p className="text-xs text-white/50">
              Toca <span className="font-semibold text-white">Instalar app</span>{" "}
              arriba para ver cómo agregar PRESI a tu inicio.
            </p>
          ) : (
            <InstallAppInstructions compact showNativeButton={false} />
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={copyUserId}
            className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 font-mono text-xs text-white/60 hover:bg-white/10"
          >
            ID: {profile.userId}
            <Copy className="h-3.5 w-3.5" />
          </button>
          {copied ? (
            <p className="mt-1 text-[10px] text-presi-gold">Copiado</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
