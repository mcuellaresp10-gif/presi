"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { MoreMenu } from "@/components/layout/MoreMenu";
import { ResourceBar } from "@/components/layout/ResourceBar";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { HowToPlayTour } from "@/components/help/HowToPlayTour";
import { homeContentBottomPadding } from "@/lib/layout/bottom-dock";
import type { ProfileSummary } from "@/lib/actions/profile";

export function GameShell({
  profile,
  children,
}: {
  profile: ProfileSummary | null;
  children: React.ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const isInicio = pathname === "/inicio";
  const immersive =
    isInicio ||
    pathname === "/" ||
    pathname.startsWith("/plantilla") ||
    pathname.startsWith("/onboarding");
  const hideNav = pathname.startsWith("/onboarding");

  return (
    <div className="poster-bg poster-shards relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-presi-gold/15 bg-presi-elevated/95 backdrop-blur-md relative">
        {profile ? <ResourceBar profile={profile} /> : null}
      </header>

      <main
        className={
          immersive
            ? `relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col${
                isInicio ? " min-h-0" : " pb-24"
              }${
                pathname.startsWith("/onboarding") ? " px-4 pt-4" : ""
              }`
            : "relative z-10 mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-24"
        }
        style={
          isInicio ? { paddingBottom: homeContentBottomPadding } : undefined
        }
      >
        {children}
      </main>

      {profile && !hideNav ? (
        <>
          <BottomNav onMoreClick={() => setMoreOpen(true)} />
          <MoreMenu
            profile={profile}
            open={moreOpen}
            onClose={() => setMoreOpen(false)}
          />
        </>
      ) : null}

      <InstallPrompt />
      {profile && !hideNav ? <HowToPlayTour /> : null}
    </div>
  );
}
