import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";

export const storiesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        topicSlug: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { topicSlug, cursor, limit } = input;

      const clusters = await prisma.storyCluster.findMany({
        where: {
          isActive: true,
          ...(topicSlug
            ? { topic: { slug: topicSlug } }
            : {}),
        },
        include: {
          topic: true,
          storyArticles: {
            include: {
              article: {
                include: { source: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (clusters.length > limit) {
        const nextItem = clusters.pop();
        nextCursor = nextItem!.id;
      }

      return { clusters, nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.storyCluster.findUnique({
        where: { id: input.id },
        include: {
          topic: true,
          storyArticles: {
            include: {
              article: {
                include: { source: true },
              },
            },
            orderBy: { addedAt: "asc" },
          },
        },
      });
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      return prisma.storyCluster.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: input.query, mode: "insensitive" } },
            { summary: { contains: input.query, mode: "insensitive" } },
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
    }),
});
