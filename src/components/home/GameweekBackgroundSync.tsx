"use client";

import { useEffect, useRef } from "react";
import { triggerGameweekSync } from "@/lib/actions/gameweek";

const SYNC_KEY = "presi_gw_sync_at";
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

/** Sync de jornada en segundo plano — no bloquea el render del servidor. */
export function GameweekBackgroundSync() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const last = Number(sessionStorage.getItem(SYNC_KEY) || 0);
    if (Date.now() - last < SYNC_INTERVAL_MS) return;

    sessionStorage.setItem(SYNC_KEY, String(Date.now()));
    void triggerGameweekSync();
  }, []);

  return null;
}
