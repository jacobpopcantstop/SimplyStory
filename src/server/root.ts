import { createTRPCRouter } from "@/server/trpc";
import { storiesRouter } from "@/server/routers/stories";
import { articlesRouter } from "@/server/routers/articles";
import { sourcesRouter } from "@/server/routers/sources";

export const appRouter = createTRPCRouter({
  stories: storiesRouter,
  articles: articlesRouter,
  sources: sourcesRouter,
});

export type AppRouter = typeof appRouter;
