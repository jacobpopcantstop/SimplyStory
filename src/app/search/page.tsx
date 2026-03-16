import { prisma } from "@/lib/prisma";
import { StoryCard } from "@/components/story-card";

export const dynamic = "force-dynamic";

async function searchStories(query: string) {
  if (!query) return [];
  return prisma.storyCluster.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      topic: true,
      storyArticles: {
        include: { article: { include: { source: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() || "";
  const stories = query ? await searchStories(query) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
      </div>

      <form method="get" action="/search">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search stories..."
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>

      {query && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {stories.length} result{stories.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      )}

      {stories.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
