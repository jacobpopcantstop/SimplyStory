import { NextRequest, NextResponse } from "next/server";
import { clusterRecentArticles } from "@/lib/clustering/cluster";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clusterRecentArticles();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Cron] cluster-stories failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
