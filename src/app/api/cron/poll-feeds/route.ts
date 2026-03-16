import { NextRequest, NextResponse } from "next/server";
import { pollAllSources } from "@/lib/ingestion/rss";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await pollAllSources();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Cron] poll-feeds failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
