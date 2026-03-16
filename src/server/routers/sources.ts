import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";

export const sourcesRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return prisma.source.findMany({
      where: { isActive: true },
      orderBy: [{ bias: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { articles: true } },
      },
    });
  }),
});
