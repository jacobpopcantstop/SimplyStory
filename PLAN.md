# SimplyStory - GroundNews Clone Implementation Plan

## Vision
An open-source news aggregator that pulls actual stories and images from news sources, presenting them in a clean, ad-free, non-clickbait interface. Like Ground News, it aggregates multiple sources per story, shows bias ratings, and lets users see the full picture — but fully open-source.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                │
│  Clean, reader-focused UI — no ads, no clickbait    │
│  • Story feed  • Multi-source view  • Bias labels   │
└──────────────────────┬──────────────────────────────┘
                       │ REST / tRPC
┌──────────────────────▼──────────────────────────────┐
│                Backend (Next.js API Routes)          │
│  • Story clustering  • Source bias scoring           │
│  • Article extraction  • Image proxy                 │
└───┬──────────┬──────────┬───────────────────────────┘
    │          │          │
    ▼          ▼          ▼
 PostgreSQL  Redis     News APIs / RSS / Scrapers
 (stories,   (cache,   (article content extraction)
  sources)    queues)
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 14 (App Router)** + Tailwind CSS + shadcn/ui | SSR for SEO, fast, modern |
| Backend | **Next.js API Routes** + tRPC | Unified codebase, type-safe |
| Database | **PostgreSQL** via Prisma ORM | Relational data (stories, sources, clusters) |
| Cache | **Redis** | Rate limiting, article cache, job queues |
| Article Extraction | **@extractus/article-extractor** + **cheerio** | Pull clean article text + images from URLs |
| News Discovery | **NewsAPI / GNews API / RSS feeds** | Discover stories from multiple outlets |
| Image Proxy | **Next.js Image** + custom proxy route | Serve images without tracking, resize on-the-fly |
| Background Jobs | **BullMQ** (Redis-backed) | Scheduled feed polling, article extraction |
| Search | **PostgreSQL full-text search** (start) → Meilisearch (scale) | Keep it simple initially |
| Auth (optional) | **NextAuth.js** | Bookmarks, preferences |
| Deployment | **Docker Compose** | One-command self-hosting |

---

## Phase 1: Foundation (MVP)

### 1.1 Project Setup
- [x] Initialize Next.js 14 project with TypeScript
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Set up Prisma with PostgreSQL schema
- [x] Docker Compose for Postgres + Redis + App
- [x] ESLint + Prettier config

### 1.2 Database Schema (Prisma)
```
Source          — news outlet (name, url, bias_rating, logo)
Article         — individual article (url, title, extracted_text, extracted_image, source_id, published_at)
StoryCluster    — grouped articles about same event (title, summary, category, created_at)
StoryArticle    — join table (story_id, article_id)
Topic           — categories (politics, tech, world, etc.)
```

### 1.3 News Ingestion Pipeline
- RSS feed parser (configurable feed list)
- NewsAPI / GNews integration for discovery
- Deduplication by URL + fuzzy title matching
- Scheduled polling via BullMQ cron jobs

### 1.4 Article Extraction Engine
- Extract clean article text using `@extractus/article-extractor`
- Fallback to `cheerio` for stubborn sites
- Extract hero image, author, publish date
- Strip ads, tracking pixels, popups
- Cache extracted content in PostgreSQL + Redis

### 1.5 Story Clustering
- Group articles covering the same event
- Approach: TF-IDF similarity on titles + published within same time window
- Lightweight — no ML dependencies initially
- Each cluster gets a neutral, non-clickbait title (longest common substring or manual curation)

---

## Phase 2: Frontend

### 2.1 Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage — top story clusters, categorized |
| `/story/[id]` | Story detail — all source articles, bias breakdown |
| `/article/[id]` | Clean article reader — extracted text + images |
| `/topic/[slug]` | Topic feed (politics, tech, world, etc.) |
| `/sources` | All tracked sources with bias ratings |
| `/search` | Full-text search across stories |

### 2.2 Story Detail Page (Core Feature)
```
┌─────────────────────────────────────────┐
│  Story: "EU Passes New AI Regulation"   │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │Left │ │Center│ │Right│  ← Bias meter │
│  │ 3   │ │  5  │ │  2  │               │
│  └─────┘ └─────┘ └─────┘               │
│                                         │
│  📰 Sources covering this story:        │
│  ┌──────────────────────────────┐       │
│  │ Reuters (Center)        [Read]│       │
│  │ BBC News (Center-Left)  [Read]│       │
│  │ Fox News (Right)        [Read]│       │
│  │ The Guardian (Left)     [Read]│       │
│  └──────────────────────────────┘       │
│                                         │
│  Summary: A neutral AI-generated or     │
│  extracted summary of the story...      │
└─────────────────────────────────────────┘
```

### 2.3 Clean Article Reader
- Distraction-free reading mode
- Extracted text with proper formatting
- Images served through our proxy (no tracking)
- Attribution link back to original source
- Estimated read time
- Font size / dark mode controls

### 2.4 UI Principles
- No ads, ever
- No clickbait headlines — use neutral, factual titles
- No infinite scroll dark patterns — paginated feeds
- Fast — target < 1s page loads
- Mobile-first responsive design
- Dark mode support
- Accessibility (WCAG 2.1 AA)

---

## Phase 3: Bias & Coverage Analysis

### 3.1 Source Bias Ratings
- Maintain a curated database of source bias ratings
- Seed with AllSides / Media Bias Fact Check data
- Schema: `LEFT | LEAN_LEFT | CENTER | LEAN_RIGHT | RIGHT`
- Community voting system to adjust over time (Phase 4)

### 3.2 Coverage Metrics per Story
- Number of sources covering the story
- Breakdown by bias category
- "Blind spot" detection — stories only covered by one side
- Visual bias distribution bar on each story card

---

## Phase 4: Polish & Scale

### 4.1 Features
- User accounts (NextAuth) — bookmarks, reading history, preferences
- Email digest — daily/weekly top stories
- "My News" personalized feed based on followed topics
- Community source bias voting
- API for third-party consumers (public REST API)
- Browser extension — "See this story on SimplyStory"

### 4.2 Scaling
- Meilisearch for fast full-text search
- CDN for proxied images
- Rate limiting per source (respectful scraping)
- Horizontal scaling via Docker Swarm / k8s

---

## Phase 5: Content Extraction Deep Dive

### 5.1 Image Proxy Design
```
/api/image-proxy?url=<encoded-original-url>&w=800&q=80
```
- Fetches image from source, strips EXIF/tracking
- Resizes + compresses on the fly (sharp)
- Caches in Redis (TTL: 24h) + disk
- Serves with proper cache headers
- Respects robots.txt and source ToS

### 5.2 Extraction Quality
- Per-source custom extraction rules (CSS selectors)
- Readability score filtering
- Paywall detection — mark articles as paywalled, don't extract
- Respect `robots.txt` and rate limits

---

## File Structure
```
SimplyStory/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Homepage
│   │   ├── story/[id]/page.tsx # Story cluster view
│   │   ├── article/[id]/page.tsx # Clean reader
│   │   ├── topic/[slug]/page.tsx
│   │   ├── sources/page.tsx
│   │   ├── search/page.tsx
│   │   └── api/
│   │       ├── trpc/[trpc]/route.ts
│   │       ├── image-proxy/route.ts
│   │       └── cron/
│   │           ├── poll-feeds/route.ts
│   │           └── cluster-stories/route.ts
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── story-card.tsx
│   │   ├── bias-meter.tsx
│   │   ├── source-badge.tsx
│   │   ├── article-reader.tsx
│   │   ├── search-bar.tsx
│   │   └── nav.tsx
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── redis.ts            # Redis client
│   │   ├── extraction/
│   │   │   ├── extractor.ts    # Article extraction engine
│   │   │   ├── image-proxy.ts  # Image fetching + processing
│   │   │   └── rules/          # Per-source extraction rules
│   │   ├── ingestion/
│   │   │   ├── rss.ts          # RSS feed parser
│   │   │   ├── newsapi.ts      # NewsAPI client
│   │   │   └── dedup.ts        # Deduplication logic
│   │   ├── clustering/
│   │   │   ├── similarity.ts   # TF-IDF text similarity
│   │   │   └── cluster.ts      # Story clustering algorithm
│   │   └── bias/
│   │       ├── ratings.ts      # Source bias database
│   │       └── coverage.ts     # Coverage analysis
│   ├── server/
│   │   ├── trpc.ts             # tRPC router setup
│   │   └── routers/
│   │       ├── stories.ts
│   │       ├── articles.ts
│   │       └── sources.ts
│   └── workers/
│       ├── feed-poller.ts      # BullMQ worker — poll RSS/APIs
│       └── clusterer.ts        # BullMQ worker — cluster stories
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                 # Seed sources + bias ratings
│   └── migrations/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Implementation Order

1. **Project scaffolding** — Next.js, Tailwind, Prisma, Docker
2. **Database schema** — Sources, Articles, StoryClusters
3. **Seed data** — 50+ news sources with bias ratings
4. **RSS ingestion** — Parse feeds, store articles
5. **Article extraction** — Clean text + images from URLs
6. **Story clustering** — Group related articles
7. **Homepage + Story page** — Display clusters with bias info
8. **Clean article reader** — Distraction-free reading
9. **Image proxy** — Serve images without tracking
10. **Search** — PostgreSQL full-text search
11. **Topics/categories** — Filter by topic
12. **Polish** — Dark mode, mobile, performance

---

## Legal / Ethical Considerations

- **Respect robots.txt** — honor crawl directives
- **Rate limiting** — max 1 req/sec per source domain
- **Attribution** — always link back to original article
- **Fair use** — show excerpts by default, full extraction opt-in
- **No paywall circumvention** — detect and label paywalled content
- **DMCA compliance** — takedown process for content owners
- **Open source license** — AGPL-3.0 (keeps forks open)
