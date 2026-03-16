import { prisma } from "@/lib/prisma";
import { StoryCard } from "@/components/story-card";

export const revalidate = 300; // ISR every 5 minutes

async function getTopStories() {
  return prisma.storyCluster.findMany({
    where: { isActive: true },
    include: {
      topic: true,
      storyArticles: {
        include: { article: { include: { source: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export default async function HomePage() {
  const stories = await getTopStories();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Top Stories</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Multiple sources, one story. No ads, no clickbait.
        </p>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No stories yet. Run the feed poller to get started.
          </p>
          <code className="mt-2 block text-xs text-gray-400">
            POST /api/cron/poll-feeds
          </code>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
