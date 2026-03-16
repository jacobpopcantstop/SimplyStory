import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { BiasMeter, SourceBadge } from "@/components/bias-meter";
import { getBiasCoverage, hasBlindSpot } from "@/lib/bias/ratings";
import { getFaviconUrl } from "@/lib/favicon";

export const revalidate = 300;

async function getStory(id: string) {
  return prisma.storyCluster.findUnique({
    where: { id },
    include: {
      topic: true,
      storyArticles: {
        include: { article: { include: { source: true } } },
        orderBy: { addedAt: "asc" },
      },
    },
  });
}

export default async function StoryPage({ params }: { params: { id: string } }) {
  const story = await getStory(params.id);
  if (!story) notFound();

  const articles = story.storyArticles.map((sa) => sa.article);
  const coverage = getBiasCoverage(articles);
  const blindSpot = hasBlindSpot(articles);

  const imageUrl = story.imageUrl || null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        ← Back to stories
      </Link>

      {/* Header */}
      <div className="space-y-4">
        {story.topic && (
          <span className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {story.topic.emoji} {story.topic.name}
          </span>
        )}
        <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
          {story.title}
        </h1>

        {imageUrl && (
          <div className="relative aspect-video overflow-hidden rounded-xl">
            <Image src={imageUrl} alt={story.title} fill sizes="768px" className="object-cover" />
          </div>
        )}

        {story.summary && (
          <p className="text-lg text-gray-600 dark:text-gray-300">{story.summary}</p>
        )}
      </div>

      {/* Coverage breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Coverage by {articles.length} source{articles.length !== 1 ? "s" : ""}
        </h2>
        <BiasMeter coverage={coverage} showLabels />
        {blindSpot && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            ⚠️ <strong>Blind spot:</strong> This story is only covered by one side of the political spectrum.
          </div>
        )}
      </div>

      {/* Article list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">All Sources</h2>
        {articles.map((article) => (
          <div
            key={article.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.source.logoUrl || getFaviconUrl(article.source.domain)}
                  alt={article.source.name}
                  className="h-4 w-4 rounded-sm"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {article.source.name}
                </span>
                <SourceBadge bias={article.source.bias} />
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {article.title}
              </p>
              {article.publishedAt && (
                <p className="mt-1 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/article/${article.id}`}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Read clean
              </Link>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Original ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
