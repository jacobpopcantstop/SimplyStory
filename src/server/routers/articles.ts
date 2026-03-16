import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";

export const articlesRouter = createTRPCRouter({
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.article.findUnique({
        where: { id: input.id },
        include: { source: true },
      });
    }),
});
