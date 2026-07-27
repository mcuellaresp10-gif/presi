"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { triggerGameweekSync } from "@/lib/actions/gameweek";

const CALENDAR_SYNC_KEY = "presi_calendar_sync_v3";
const CALENDAR_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
/** While live, ask the server to refresh stats/points periodically. */
const LIVE_SYNC_INTERVAL_MS = 3 * 60 * 1000;

/**
 * Background gameweek sync:
 * - Always: calendar sync at most once / 24h
 * - When live: full tick every ~3 minutes so home VS can catch new points
 */
export function GameweekBackgroundSync({
  live = false,
}: {
  live?: boolean;
}) {
  const started = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const last = Number(localStorage.getItem(CALENDAR_SYNC_KEY) || 0);
    const shouldCalendarSync =
      !last || Date.now() - last >= CALENDAR_SYNC_INTERVAL_MS;

    if (shouldCalendarSync) {
      localStorage.setItem(CALENDAR_SYNC_KEY, String(Date.now()));
      void triggerGameweekSync().then(() => router.refresh());
    } else if (live) {
      void triggerGameweekSync().then(() => router.refresh());
    }
  }, [live, router]);

  useEffect(() => {
    if (!live) return;

    const id = window.setInterval(() => {
      void triggerGameweekSync().then(() => router.refresh());
    }, LIVE_SYNC_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [live, router]);

  return null;
}
