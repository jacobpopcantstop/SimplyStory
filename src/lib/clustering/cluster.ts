import { prisma } from "@/lib/prisma";
import { tokenize, areSameStory, pickBestTitle } from "./similarity";
import { subHours } from "date-fns";

const CLUSTER_WINDOW_HOURS = 48;
const SIMILARITY_THRESHOLD = 0.25;
const MIN_CLUSTER_SIZE = 1;
const BATCH_SIZE = 200;

export async function clusterRecentArticles(): Promise<void> {
  const since = subHours(new Date(), CLUSTER_WINDOW_HOURS);

  const articles = await prisma.article.findMany({
    where: {
      publishedAt: { gte: since },
      status: { in: ["PENDING", "EXTRACTED"] },
      storyArticles: { none: {} },
    },
    orderBy: { publishedAt: "desc" },
    take: BATCH_SIZE,
  });

  if (articles.length === 0) return;

  console.log(`[Cluster] Processing ${articles.length} articles...`);

  // Build inverted index: token -> article indices (avoids O(n²) full scan)
  const tokenIndex = new Map<string, number[]>();
  const articleTokens = articles.map((a, i) => {
    const tokens = tokenize(a.title);
    for (const token of tokens) {
      if (!tokenIndex.has(token)) tokenIndex.set(token, []);
      tokenIndex.get(token)!.push(i);
    }
    return tokens;
  });

  // Union-find
  const parent: number[] = articles.map((_, i) => i);

  function find(i: number): number {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  }

  function union(i: number, j: number): void {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[ri] = rj;
  }

  // Only compare articles that share at least one token
  const compared = new Set<string>();
  for (const [, indices] of tokenIndex) {
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = indices[a];
        const j = indices[b];
        const key = i < j ? `${i}:${j}` : `${j}:${i}`;
        if (compared.has(key)) continue;
        compared.add(key);

        if (areSameStory(articles[i].title, articles[j].title, SIMILARITY_THRESHOLD)) {
          union(i, j);
        }
      }
    }
  }

  // Build groups
  const groups = new Map<number, number[]>();
  for (let i = 0; i < articles.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  // Create story clusters
  let created = 0;
  for (const [, indices] of groups) {
    if (indices.length < MIN_CLUSTER_SIZE) continue;

    const groupArticles = indices.map((i) => articles[i]);
    const title = pickBestTitle(groupArticles.map((a) => a.title));
    const image = groupArticles.find((a) => a.extractedImage)?.extractedImage || null;

    await prisma.storyCluster.create({
      data: {
        title,
        imageUrl: image,
        storyArticles: {
          create: groupArticles.map((a) => ({ articleId: a.id })),
        },
      },
    });

    created++;
  }

  console.log(`[Cluster] Created ${created} clusters from ${articles.length} articles`);
}
