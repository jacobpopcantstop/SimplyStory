import { prisma } from "@/lib/prisma";
import { areSameStory, pickBestTitle } from "./similarity";
import { subHours } from "date-fns";

const CLUSTER_WINDOW_HOURS = 48;
const SIMILARITY_THRESHOLD = 0.25;
const MIN_CLUSTER_SIZE = 1;

export async function clusterRecentArticles(): Promise<void> {
  const since = subHours(new Date(), CLUSTER_WINDOW_HOURS);

  // Fetch recent unclustered articles
  const articles = await prisma.article.findMany({
    where: {
      publishedAt: { gte: since },
      status: { in: ["PENDING", "EXTRACTED"] },
      storyArticles: { none: {} },
    },
    orderBy: { publishedAt: "desc" },
    take: 500,
  });

  if (articles.length === 0) return;

  console.log(`[Cluster] Processing ${articles.length} articles...`);

  // Union-find style grouping
  const groups: Map<number, number[]> = new Map();
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

  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      if (areSameStory(articles[i].title, articles[j].title, SIMILARITY_THRESHOLD)) {
        union(i, j);
      }
    }
  }

  // Build groups
  for (let i = 0; i < articles.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  // Create story clusters
  for (const [, indices] of groups) {
    if (indices.length < MIN_CLUSTER_SIZE) continue;

    const groupArticles = indices.map((i) => articles[i]);
    const title = pickBestTitle(groupArticles.map((a) => a.title));
    const image = groupArticles.find((a) => a.extractedImage)?.extractedImage || null;

    const cluster = await prisma.storyCluster.create({
      data: {
        title,
        imageUrl: image,
        storyArticles: {
          create: groupArticles.map((a) => ({ articleId: a.id })),
        },
      },
    });

    console.log(`[Cluster] Created cluster "${cluster.title}" with ${groupArticles.length} articles`);
  }
}
