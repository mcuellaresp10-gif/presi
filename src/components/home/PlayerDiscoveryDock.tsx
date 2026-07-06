"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ScoutingPackPin } from "@/components/home/ScoutingPackPin";
import type { ScoutingUIState } from "@/components/scouting/ScoutingPackCard";
import {
  scoutingDockBottom,
  Z_SCOUTING_DOCK,
} from "@/lib/layout/bottom-dock";

export function PlayerDiscoveryDock({
  state,
}: {
  state: ScoutingUIState;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-x-0 px-4"
      style={{ bottom: scoutingDockBottom, zIndex: Z_SCOUTING_DOCK }}
    >
      <div className="mx-auto max-w-lg">
        <ScoutingPackPin state={state} />
      </div>
    </div>,
    document.body
  );
}
