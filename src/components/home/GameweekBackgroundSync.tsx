"use client";

import { useEffect, useRef } from "react";
import { triggerGameweekSync } from "@/lib/actions/gameweek";

const SYNC_KEY = "presi_gameweek_sync_v6";
/** Status-only tick at most this often. Scoring/stats → cron. */
const SYNC_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Light background status tick only.
 * Must NEVER call API-Football stats sync from the browser — that blocked
 * the Next server for 10+ minutes (POST /inicio) and froze Plantilla.
 */
export function GameweekBackgroundSync({
  live = false,
}: {
  live?: boolean;
}) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const last = Number(localStorage.getItem(SYNC_KEY) || 0);
    const due = !last || Date.now() - last >= SYNC_INTERVAL_MS;
    // Skip while live too — cron owns live scoring; status tick is enough rarely.
    if (!due) return;

    localStorage.setItem(SYNC_KEY, String(Date.now()));
    void triggerGameweekSync();
  }, [live]);

  return null;
}
