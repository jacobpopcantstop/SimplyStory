import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BiasMeter } from "@/components/bias-meter";
import { getBiasCoverage, hasBlindSpot } from "@/lib/bias/ratings";
import { cn } from "@/lib/utils";
import type { StoryCluster, StoryArticle, Article, Source, Topic } from "@prisma/client";

type StoryWithArticles = StoryCluster & {
  topic: Topic | null;
  storyArticles: (StoryArticle & {
    article: Article & { source: Source };
  })[];
};

interface StoryCardProps {
  story: StoryWithArticles;
  className?: string;
}

export function StoryCard({ story, className }: StoryCardProps) {
  const articles = story.storyArticles.map((sa) => sa.article);
  const coverage = getBiasCoverage(articles);
  const blindSpot = hasBlindSpot(articles);
  const sourceCount = articles.length;

  const imageUrl = story.imageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(story.imageUrl)}&w=400&q=75`
    : null;

  return (
    <Link href={`/story/${story.id}`}>
      <article
        className={cn(
          "group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900",
          className
        )}
      >
        {imageUrl && (
          <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={story.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {story.topic && (
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              {story.topic.emoji} {story.topic.name}
            </span>
          )}
          <h2 className="line-clamp-3 text-base font-semibold leading-snug text-gray-900 group-hover:text-blue-700 dark:text-gray-100 dark:group-hover:text-blue-400">
            {story.title}
          </h2>
          <div className="mt-auto space-y-2">
            <BiasMeter coverage={coverage} />
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {sourceCount} source{sourceCount !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                {blindSpot && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    Blind spot
                  </span>
                )}
                <span>
                  {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
