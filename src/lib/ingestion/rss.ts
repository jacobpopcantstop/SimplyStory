import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; SimplyStory/1.0)",
  },
});

export async function pollSource(sourceId: string): Promise<number> {
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
  });

  if (!source || !source.isActive || source.rssFeeds.length === 0) return 0;

  let newArticles = 0;

  for (const feedUrl of source.rssFeeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items) {
        if (!item.link || !item.title) continue;

        // Normalize URL
        const url = item.link.split("?")[0]; // strip tracking params

        const result = await prisma.article.upsert({
          where: { url },
          update: {},
          create: {
            url,
            title: item.title.trim(),
            description: item.contentSnippet?.slice(0, 500) || null,
            author: item.creator || null,
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
            sourceId: source.id,
          },
        });

        // If createdAt is within last 5 seconds, it was just created
        if (Date.now() - result.createdAt.getTime() < 5000) {
          newArticles++;
        }
      }
    } catch (err) {
      console.error(`[RSS] Failed to poll feed ${feedUrl}:`, err);
    }
  }

  return newArticles;
}

export async function pollAllSources(): Promise<void> {
  const sources = await prisma.source.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  console.log(`[RSS] Polling ${sources.length} sources...`);

  // Poll in parallel batches of 10 to avoid overwhelming connections
  const BATCH_SIZE = 10;
  let totalNew = 0;

  for (let i = 0; i < sources.length; i += BATCH_SIZE) {
    const batch = sources.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (source) => {
        const count = await pollSource(source.id);
        if (count > 0) {
          console.log(`[RSS] ${source.name}: +${count} new articles`);
        }
        return count;
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") totalNew += result.value;
    }
  }

  console.log(`[RSS] Done. ${totalNew} new articles total.`);
}
