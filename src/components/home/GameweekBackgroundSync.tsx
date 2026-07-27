"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { triggerGameweekSync } from "@/lib/actions/gameweek";

const SYNC_KEY = "presi_gameweek_sync_v4";
/** Always allow a scoring/catch-up tick at least this often (finished GWs too). */
const SYNC_INTERVAL_MS = 10 * 60 * 1000;
/** While live, refresh stats/points more often. */
const LIVE_SYNC_INTERVAL_MS = 3 * 60 * 1000;

/**
 * Background gameweek sync so home VS can show points for live
 * and recently finished jornadas (catch-up scoring).
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

    const last = Number(localStorage.getItem(SYNC_KEY) || 0);
    const due = !last || Date.now() - last >= SYNC_INTERVAL_MS;
    if (!due && !live) return;

    localStorage.setItem(SYNC_KEY, String(Date.now()));
    void triggerGameweekSync().then(() => router.refresh());
  }, [live, router]);

  useEffect(() => {
    if (!live) return;

    const id = window.setInterval(() => {
      localStorage.setItem(SYNC_KEY, String(Date.now()));
      void triggerGameweekSync().then(() => router.refresh());
    }, LIVE_SYNC_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [live, router]);

  return null;
}
