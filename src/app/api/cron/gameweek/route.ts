import { NextRequest, NextResponse } from "next/server";
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
    const result = await runGameweekCronPipeline(supabase, {
      skipCalendar,
      gameweekIds,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
