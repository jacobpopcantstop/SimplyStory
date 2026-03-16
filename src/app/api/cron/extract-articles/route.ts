import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractArticle } from "@/lib/extraction/extractor";

const BATCH_SIZE = 20;
const EXTRACT_TIMEOUT_MS = 8000;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET env var is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.article.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: BATCH_SIZE,
  });

  let extracted = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    pending.map(async (article) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS);

      try {
        const result = await extractArticle(article.url);
        clearTimeout(timeout);

        await prisma.article.update({
          where: { id: article.id },
          data: {
            extractedText: result.content,
            extractedImage: result.image,
            author: result.author || article.author,
            readingTimeMin: result.readingTime,
            status: "EXTRACTED",
          },
        });
        extracted++;
      } catch (err) {
        clearTimeout(timeout);
        const isPaywalled = err instanceof Error && err.message === "PAYWALLED";
        await prisma.article.update({
          where: { id: article.id },
          data: { status: isPaywalled ? "PAYWALLED" : "FAILED" },
        });
        failed++;
      }
    })
  );

  console.log(`[Extract] Processed ${results.length}: ${extracted} extracted, ${failed} failed`);
  return NextResponse.json({ processed: results.length, extracted, failed });
}
