import { NextRequest, NextResponse } from "next/server";
import { syncPlayersFromApi } from "@/lib/gameweek/sync";
import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Weekly (or manual) full league player catalog sync + re-tier.
 * Keep this off the page-load path — it paginates the whole API-Football roster.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await syncPlayersFromApi(supabase);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Players sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
