"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  MoreHorizontal,
  ShoppingBag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/plantilla", label: "Plantilla", icon: Users },
  { href: "/tienda", label: "Tienda", icon: ShoppingBag },
  { href: "/inicio", label: "Inicio", icon: Home, center: true },
  { href: "/instalaciones", label: "Instal.", icon: Building2 },
  { href: "__more__", label: "Más", icon: MoreHorizontal, isMore: true },
] as const;

export function BottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-presi-sand/15 bg-presi-elevated/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-end justify-around px-1 pt-1 pb-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isMore = "isMore" in item && item.isMore;
          const isCenter = "center" in item && item.center;
          const active =
            !isMore &&
            (pathname === item.href ||
              (item.href === "/inicio" && pathname === "/"));

          if (isMore) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={onMoreClick}
                className="flex min-h-[44px] min-w-[3.5rem] flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-white/50 transition hover:text-presi-cyan"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          }

          if (isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative -mt-4 flex min-h-[52px] min-w-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 text-[10px] font-bold transition",
                  active
                    ? "bg-presi-cyan text-presi-bg nav-glow"
                    : "bg-presi-surface text-white/70 ring-2 ring-presi-cyan/30 hover:text-presi-cyan"
                )}
              >
                <Icon className="h-6 w-6" />
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[3.5rem] flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-semibold transition",
                active
                  ? "text-presi-gold"
                  : "text-white/50 hover:text-presi-cyan"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-presi-gold")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
