"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Building2,
  Trophy,
  BarChart3,
  ShoppingBag,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/plantilla", label: "Plantilla", icon: Users },
  { href: "/tienda", label: "Tienda", icon: ShoppingBag },
  { href: "/instalaciones", label: "Instalaciones", icon: Building2 },
  { href: "/ligas", label: "Ligas", icon: Trophy },
  { href: "/ranking", label: "Ranking", icon: BarChart3 },
];

export function GameNav() {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");

  if (isOnboarding) return null;

  return (
    <nav className="border-t border-white/5 bg-presi-elevated/95 backdrop-blur">
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
              className={`relative flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-sm px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                active
                  ? "bg-presi-gold/15 text-presi-gold"
                  : "text-white/50 hover:bg-white/5 hover:text-presi-cyan"
              }`}
            >
              {active && (
                <span className="absolute -top-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-presi-gold" />
              )}
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
