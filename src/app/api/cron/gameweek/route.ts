import { NextRequest, NextResponse } from "next/server";
import {
  lockLineupSnapshots,
  processGameweekPointsAndContracts,
  tickGameweekStatuses,
} from "@/lib/gameweek/processor";
import { runGameweekCronPipeline } from "@/lib/gameweek/sync";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const skipCalendar =
      request.nextUrl.searchParams.get("skipCalendar") === "1" ||
      request.headers.get("x-skip-calendar") === "1";
    const forceCalendar =
      request.nextUrl.searchParams.get("forceCalendar") === "1" ||
      request.headers.get("x-force-calendar") === "1";
    /** Rescore from DB stats only — no API-Football fetch. */
    const pointsOnly =
      request.nextUrl.searchParams.get("pointsOnly") === "1" ||
      request.headers.get("x-points-only") === "1";
    let gameweekIds: string[] | undefined;
    try {
      const body = (await request.json()) as { gameweekIds?: string[] };
      if (Array.isArray(body?.gameweekIds)) {
        gameweekIds = body.gameweekIds.filter((id) => typeof id === "string");
      }
    } catch {
      // no JSON body
    }

    const supabase = createServiceRoleClient();

    if (pointsOnly) {
      await tickGameweekStatuses(supabase);

      let targets: Array<{
        id: string;
        season: number;
        round: number;
        first_kickoff_at: string;
        last_kickoff_at: string | null;
        status: string;
      }> = [];

      if (gameweekIds?.length) {
        const { data } = await supabase
          .from("gameweeks")
          .select(
            "id, season, round, first_kickoff_at, last_kickoff_at, status"
          )
          .in("id", gameweekIds);
        targets = data ?? [];
      } else {
        const { data } = await supabase
          .from("gameweeks")
          .select(
            "id, season, round, first_kickoff_at, last_kickoff_at, status"
          )
          .in("status", ["live", "finished"]);
        targets = data ?? [];
      }

      const scored: Array<{ id: string; clubsProcessed: number }> = [];
      for (const gw of targets) {
        await lockLineupSnapshots(supabase, gw);
        const result = await processGameweekPointsAndContracts(
          supabase,
          gw.id
        );
        scored.push({ id: gw.id, clubsProcessed: result.clubsProcessed });
      }
      return NextResponse.json({
        mode: "points_only",
        scored,
      });
    }

    const result = await runGameweekCronPipeline(supabase, {
      skipCalendar,
      forceCalendar,
      gameweekIds,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
