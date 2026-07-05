"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ScoutingPackPin } from "@/components/home/ScoutingPackPin";
import type { ScoutingUIState } from "@/components/scouting/ScoutingPackCard";

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
    <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[70] px-4">
      <div className="mx-auto max-w-lg">
        <ScoutingPackPin state={state} />
      </div>
    </div>,
    document.body
  );
}
