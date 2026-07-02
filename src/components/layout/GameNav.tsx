"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Building2,
  Trophy,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/plantilla", label: "Plantilla", icon: Users },
  { href: "/instalaciones", label: "Instalaciones", icon: Building2 },
  { href: "/ligas", label: "Ligas", icon: Trophy },
  { href: "/ranking", label: "Ranking", icon: BarChart3 },
];

export function GameNav() {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");

  if (isOnboarding) return null;

  return (
    <nav className="border-b border-andes-deep/10 bg-andes-deep/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl justify-around gap-1 overflow-x-auto px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/inicio" && pathname === "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                active
                  ? "bg-andes-gold/20 text-andes-gold"
                  : "text-white/70 hover:bg-white/10 hover:text-andes-gold"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
