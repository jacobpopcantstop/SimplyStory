import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { extractArticle } from "@/lib/extraction/extractor";
import { SourceBadge } from "@/components/bias-meter";

export const dynamic = "force-dynamic";

async function getArticle(id: string) {
  const article = await prisma.article.findUnique({
    where: { id },
    include: { source: true },
  });

  if (!article) return null;

  if (article.status === "PENDING") {
    try {
      const extracted = await extractArticle(article.url);
      return prisma.article.update({
        where: { id },
        data: {
          extractedText: extracted.content,
          extractedImage: extracted.image,
          author: extracted.author || article.author,
          readingTimeMin: extracted.readingTime,
          status: "EXTRACTED",
        },
        include: { source: true },
      });
    } catch (err) {
      const isPaywalled = err instanceof Error && err.message === "PAYWALLED";
      return prisma.article.update({
        where: { id },
        data: { status: isPaywalled ? "PAYWALLED" : "FAILED" },
        include: { source: true },
      });
    }
  }

  return article;
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  if (!article) notFound();

  const imageUrl = article.extractedImage || null;

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        ← Back
      </Link>

      {/* Source info */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.source.logoUrl || `https://www.google.com/s2/favicons?domain=${article.source.domain}&sz=32`}
          alt={article.source.name}
          className="h-6 w-6 rounded"
        />
        <span className="font-medium text-gray-700 dark:text-gray-300">{article.source.name}</span>
        <SourceBadge bias={article.source.bias} />
        {article.publishedAt && (
          <span className="text-sm text-gray-400">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </span>
        )}
        {article.readingTimeMin && (
          <span className="text-sm text-gray-400">{article.readingTimeMin} min read</span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
        {article.title}
      </h1>

      {/* Hero image */}
      {imageUrl && (
        <div className="relative aspect-video overflow-hidden rounded-xl">
          <Image src={imageUrl} alt={article.imageAlt || article.title} fill sizes="672px" className="object-cover" />
        </div>
      )}

      {/* Author */}
      {article.author && (
        <p className="text-sm text-gray-500 dark:text-gray-400">By {article.author}</p>
      )}

      {/* Content */}
      {article.status === "PAYWALLED" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20">
          <p className="font-medium text-amber-700 dark:text-amber-400">
            🔒 This article is behind a paywall
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Read on {article.source.name} ↗
          </a>
        </div>
      ) : article.status === "FAILED" || !article.extractedText ? (
        <div className="rounded-xl border border-gray-200 p-6 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Could not extract article content.
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            Read original ↗
          </a>
        </div>
      ) : (
        <div className="prose prose-gray max-w-none dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold">
          {article.extractedText.split("\n").filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {/* Attribution footer */}
      <footer className="border-t border-gray-200 pt-6 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Article sourced from{" "}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {article.source.name}
          </a>
          . SimplyStory is not the publisher of this content.
        </p>
      </footer>
    </article>
  );
}
