"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { ResourcePill } from "@/components/ui/resource-pill";
import type { ProfileSummary } from "@/lib/actions/profile";
import { subscribeWalletUpdate } from "@/lib/wallet-events";
import { formatCompactMoney } from "@/lib/utils";

export function ResourceBar({ profile }: { profile: ProfileSummary }) {
  const pathname = usePathname();
  const serverPresupuesto = profile.club?.presupuesto ?? 0;
  const serverGemas = profile.gemas ?? 0;
  const [presupuesto, setPresupuesto] = useState(serverPresupuesto);
  const [gemas, setGemas] = useState(serverGemas);

  useEffect(() => {
    setPresupuesto(serverPresupuesto);
    setGemas(serverGemas);
  }, [serverPresupuesto, serverGemas]);

  useEffect(() => {
    return subscribeWalletUpdate((update) => {
      if (typeof update.presupuesto === "number") {
        setPresupuesto(update.presupuesto);
      }
      if (typeof update.gemas === "number") {
        setGemas(update.gemas);
      }
    });
  }, []);

  if (pathname.startsWith("/onboarding")) {
    return (
      <div className="mx-auto flex max-w-lg items-center justify-center gap-2 px-4 py-2.5">
        <BrandLogo size={28} />
        <p className="text-display text-lg text-presi-gold">PRESI</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-2">
      <Link href="/inicio" className="flex min-w-0 items-center gap-2">
        {profile.club ? (
          <EscudoRenderer config={profile.club.escudo_config} size={28} />
        ) : null}
        <p className="truncate text-xs font-bold uppercase tracking-wide">
          {profile.club?.nombre ?? "PRESI"}
        </p>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        <ResourcePill
          variant="gold"
          label={formatCompactMoney(presupuesto)}
        />
        <ResourcePill
          variant="gem"
          icon={<Gem className="h-3 w-3 text-presi-gold" />}
          label={gemas.toLocaleString("es-CO")}
        />
      </div>
    </div>
  );
}
