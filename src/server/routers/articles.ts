import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";
import { extractArticle } from "@/lib/extraction/extractor";

export const articlesRouter = createTRPCRouter({
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const article = await prisma.article.findUnique({
        where: { id: input.id },
        include: { source: true },
      });

      if (!article) return null;

      // Auto-extract if not yet done
      if (article.status === "PENDING") {
        try {
          const extracted = await extractArticle(article.url);
          const updated = await prisma.article.update({
            where: { id: article.id },
            data: {
              extractedText: extracted.content,
              extractedImage: extracted.image,
              author: extracted.author || article.author,
              readingTimeMin: extracted.readingTime,
              status: "EXTRACTED",
            },
            include: { source: true },
          });
          return updated;
        } catch (err) {
          const isPaywalled =
            err instanceof Error && err.message === "PAYWALLED";
          await prisma.article.update({
            where: { id: article.id },
            data: { status: isPaywalled ? "PAYWALLED" : "FAILED" },
          });
        }
      }

      return article;
    }),
});
