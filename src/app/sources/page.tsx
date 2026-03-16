import { prisma } from "@/lib/prisma";
import { BIAS_LABELS, BIAS_COLORS, BIAS_ORDER } from "@/lib/bias/ratings";
import { BiasRating } from "@prisma/client";

export const revalidate = 3600;

async function getSources() {
  return prisma.source.findMany({
    where: { isActive: true },
    include: { _count: { select: { articles: true } } },
    orderBy: [{ bias: "asc" }, { name: "asc" }],
  });
}

export default async function SourcesPage() {
  const sources = await getSources();

  const grouped = BIAS_ORDER.reduce((acc, bias) => {
    acc[bias] = sources.filter((s) => s.bias === bias);
    return acc;
  }, {} as Record<BiasRating, typeof sources>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">News Sources</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {sources.length} sources tracked · Bias ratings based on AllSides / MBFC data
        </p>
      </div>

      {BIAS_ORDER.map((bias) => {
        const group = grouped[bias];
        if (!group || group.length === 0) return null;
        return (
          <section key={bias}>
            <h2
              className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-white"
              style={{ backgroundColor: BIAS_COLORS[bias] }}
            >
              {BIAS_LABELS[bias]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={source.logoUrl || `https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                    alt={source.name}
                    className="h-8 w-8 rounded"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {source.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">{source.domain}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-gray-400">
                    {source._count.articles} articles
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
