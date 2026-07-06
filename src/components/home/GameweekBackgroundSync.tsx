"use client";

import { useEffect, useRef } from "react";
import { triggerGameweekSync } from "@/lib/actions/gameweek";

const SYNC_KEY = "presi_calendar_sync_v3";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Sync del calendario en segundo plano (máx. una vez cada 24 h). */
export function GameweekBackgroundSync() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const last = Number(localStorage.getItem(SYNC_KEY) || 0);
    const shouldSync =
      !last || Date.now() - last >= SYNC_INTERVAL_MS;

    if (!shouldSync) return;

    localStorage.setItem(SYNC_KEY, String(Date.now()));
    void triggerGameweekSync();
  }, []);

  return null;
}
