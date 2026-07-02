"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Copy,
  LogOut,
  Menu,
  Shield,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import type { ProfileSummary } from "@/lib/actions/profile";
import { useToast } from "@/components/ui/use-toast";

const MENU_ITEMS = [
  { href: "/perfil", label: "Mi perfil", icon: User },
  { href: "/plantilla", label: "Mi plantilla", icon: Users },
  { href: "/ligas", label: "Mis ligas", icon: Trophy },
  { href: "/ranking", label: "Ranking global", icon: BarChart3 },
  { href: "/instalaciones", label: "Instalaciones", icon: Building2 },
] as const;

export function ProfilePanel({
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

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[#0a1628] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Perfil
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-6 py-6 text-center">
          <div className="relative mx-auto mb-3 inline-block">
            {profile.club ? (
              <EscudoRenderer config={profile.club.escudo_config} size={72} />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/10">
                <Shield className="h-8 w-8 text-white/40" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-andes-accent ring-2 ring-[#0a1628]">
              <User className="h-3.5 w-3.5 text-andes-deep" />
            </span>
          </div>
          <p className="text-lg font-black uppercase tracking-wide">
            {profile.club?.nombre ?? "Sin club"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-white/60">
            {profile.displayName}
          </p>
          <p className="mt-1 truncate text-xs text-white/40">{profile.email}</p>
        </div>

        <div className="bg-cyan-500 px-4 py-2 text-center text-xs font-black uppercase tracking-wider text-andes-deep">
          Liga BetPlay · Temporada {new Date().getFullYear()}
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/10 px-4 py-4">
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <p className="text-lg font-black text-cyan-300">
              {profile.seasonPoints.toLocaleString("es-CO")}
            </p>
            <p className="text-[9px] uppercase text-white/50">Temporada</p>
          </div>
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <p className="text-lg font-black text-cyan-300">
              {profile.globalRank ? `#${profile.globalRank}` : "—"}
            </p>
            <p className="text-[9px] uppercase text-white/50">Ranking</p>
          </div>
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <p className="text-lg font-black text-cyan-300">
              {profile.leaguesCount}
            </p>
            <p className="text-[9px] uppercase text-white/50">Ligas</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 border-b border-white/5 px-3 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/90 transition hover:bg-white/5"
              >
                <Icon className="h-4 w-4 shrink-0 text-white/50" />
                {item.label}
              </Link>
            );
          })}

          <form action="/auth/signout" method="post" className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-3.5 text-sm font-semibold uppercase tracking-wide text-red-300 transition hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Salir
            </button>
          </form>
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            ID de soporte
          </p>
          <button
            type="button"
            onClick={copyUserId}
            className="mt-1 flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 font-mono text-sm text-white/80 hover:bg-white/10"
          >
            {profile.userId}
            <Copy className="h-4 w-4 text-white/40" />
          </button>
          {copied && (
            <p className="mt-1 text-[10px] text-emerald-400">Copiado</p>
          )}
        </div>
      </aside>
    </div>
  );
}

export function GameHeader({ profile }: { profile: ProfileSummary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/onboarding")) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <p className="text-sm font-bold">PRESI</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <Link href="/inicio" className="flex min-w-0 flex-1 items-center gap-3">
          {profile.club ? (
            <EscudoRenderer config={profile.club.escudo_config} size={32} />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">
              {profile.club?.nombre ?? "PRESI"}
            </p>
            <p className="text-[10px] text-andes-gold/80">Liga BetPlay</p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Abrir perfil"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <ProfilePanel
        profile={profile}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
