"use client";

import { useEffect, useState, useTransition } from "react";
import { getClubsGameweekPoints } from "@/lib/actions/gameweek";

const POLL_MS = 30_000;

/**
 * Keeps home VS scores fresh by re-reading club_gameweek_points
 * while the jornada is live (or recently finished).
 */
export function useLiveGameweekScores({
  gameweekId,
  myClubId,
  rivalClubId,
  initialMyPoints,
  initialRivalPoints,
  active,
}: {
  gameweekId: string | null;
  myClubId: string | null;
  rivalClubId: string | null;
  initialMyPoints: number;
  initialRivalPoints: number;
  active: boolean;
}) {
  const [myPoints, setMyPoints] = useState(initialMyPoints);
  const [rivalPoints, setRivalPoints] = useState(initialRivalPoints);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMyPoints(initialMyPoints);
    setRivalPoints(initialRivalPoints);
  }, [initialMyPoints, initialRivalPoints, gameweekId]);

  useEffect(() => {
    if (!active || !gameweekId || !myClubId) return;

    function refresh() {
      startTransition(async () => {
        const ids = [myClubId!, rivalClubId].filter(Boolean) as string[];
        const map = await getClubsGameweekPoints(gameweekId!, ids);
        setMyPoints(map[myClubId!] ?? 0);
        if (rivalClubId) {
          setRivalPoints(map[rivalClubId] ?? 0);
        }
      });
    }

    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [active, gameweekId, myClubId, rivalClubId]);

  return { myPoints, rivalPoints };
}
