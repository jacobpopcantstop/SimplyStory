import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StoryCard } from "@/components/story-card";

export const revalidate = 300;

async function getTopicStories(slug: string) {
  const topic = await prisma.topic.findUnique({ where: { slug } });
  if (!topic) return null;

  const stories = await prisma.storyCluster.findMany({
    where: { isActive: true, topicId: topic.id },
    include: {
      topic: true,
      storyArticles: {
        include: { article: { include: { source: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return { topic, stories };
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const data = await getTopicStories(params.slug);
  if (!data) notFound();

  const { topic, stories } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {topic.emoji} {topic.name}
        </h1>
        {topic.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{topic.description}</p>
        )}
      </div>

      {stories.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No stories in this topic yet.</p>
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
