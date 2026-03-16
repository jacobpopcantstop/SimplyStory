import { PrismaClient, BiasRating } from "@prisma/client";

const prisma = new PrismaClient();

interface SourceSeed {
  name: string;
  domain: string;
  logoUrl?: string;
  rssFeeds: string[];
  bias: BiasRating;
  country?: string;
}

const sources: SourceSeed[] = [
  // LEFT
  { name: "The Nation", domain: "thenation.com", bias: "LEFT", rssFeeds: ["https://www.thenation.com/feed/?post_type=article"] },
  { name: "Mother Jones", domain: "motherjones.com", bias: "LEFT", rssFeeds: ["https://www.motherjones.com/feed/"] },
  { name: "Democracy Now!", domain: "democracynow.org", bias: "LEFT", rssFeeds: ["https://www.democracynow.org/democracynow.rss"] },
  { name: "Jacobin", domain: "jacobin.com", bias: "LEFT", rssFeeds: ["https://jacobin.com/feed/"] },
  { name: "Common Dreams", domain: "commondreams.org", bias: "LEFT", rssFeeds: ["https://www.commondreams.org/rss.xml"] },

  // LEAN LEFT
  { name: "The Guardian", domain: "theguardian.com", bias: "LEAN_LEFT", rssFeeds: ["https://www.theguardian.com/world/rss", "https://www.theguardian.com/us-news/rss"] },
  { name: "New York Times", domain: "nytimes.com", bias: "LEAN_LEFT", rssFeeds: ["https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"] },
  { name: "Washington Post", domain: "washingtonpost.com", bias: "LEAN_LEFT", rssFeeds: ["https://feeds.washingtonpost.com/rss/national", "https://feeds.washingtonpost.com/rss/world"] },
  { name: "NPR", domain: "npr.org", bias: "LEAN_LEFT", rssFeeds: ["https://feeds.npr.org/1001/rss.xml", "https://feeds.npr.org/1004/rss.xml"] },
  { name: "MSNBC", domain: "msnbc.com", bias: "LEAN_LEFT", rssFeeds: ["http://www.msnbc.com/feeds/latest"] },
  { name: "CNN", domain: "cnn.com", bias: "LEAN_LEFT", rssFeeds: ["http://rss.cnn.com/rss/cnn_topstories.rss", "http://rss.cnn.com/rss/cnn_world.rss"] },
  { name: "NBC News", domain: "nbcnews.com", bias: "LEAN_LEFT", rssFeeds: ["http://feeds.nbcnews.com/nbcnews/public/news"] },
  { name: "Los Angeles Times", domain: "latimes.com", bias: "LEAN_LEFT", rssFeeds: ["https://www.latimes.com/rss2.0.xml"] },
  { name: "The Atlantic", domain: "theatlantic.com", bias: "LEAN_LEFT", rssFeeds: ["https://www.theatlantic.com/feed/all/"] },
  { name: "Vox", domain: "vox.com", bias: "LEAN_LEFT", rssFeeds: ["https://www.vox.com/rss/index.xml"] },
  { name: "Huffington Post", domain: "huffpost.com", bias: "LEAN_LEFT", rssFeeds: ["https://www.huffpost.com/section/front-page/feed"] },
  { name: "Politico", domain: "politico.com", bias: "LEAN_LEFT", rssFeeds: ["https://www.politico.com/rss/politicopicks.xml"] },
  { name: "The Intercept", domain: "theintercept.com", bias: "LEAN_LEFT", rssFeeds: ["https://theintercept.com/feed/?rss"] },
  { name: "ProPublica", domain: "propublica.org", bias: "LEAN_LEFT", rssFeeds: ["https://feeds.propublica.org/propublica/main"] },
  { name: "Slate", domain: "slate.com", bias: "LEAN_LEFT", rssFeeds: ["https://feeds.slate.com/slate/all"] },

  // CENTER
  { name: "Reuters", domain: "reuters.com", bias: "CENTER", rssFeeds: ["https://feeds.reuters.com/reuters/topNews", "https://feeds.reuters.com/reuters/worldNews"] },
  { name: "Associated Press", domain: "apnews.com", bias: "CENTER", rssFeeds: ["https://rsshub.app/apnews/topics/apf-topnews"] },
  { name: "BBC News", domain: "bbc.com", bias: "CENTER", rssFeeds: ["http://feeds.bbci.co.uk/news/rss.xml", "http://feeds.bbci.co.uk/news/world/rss.xml"] },
  { name: "The Hill", domain: "thehill.com", bias: "CENTER", rssFeeds: ["https://thehill.com/rss/syndicator/19110"] },
  { name: "Axios", domain: "axios.com", bias: "CENTER", rssFeeds: ["https://api.axios.com/feed/"] },
  { name: "Bloomberg", domain: "bloomberg.com", bias: "CENTER", rssFeeds: ["https://feeds.bloomberg.com/politics/news.rss"] },
  { name: "Financial Times", domain: "ft.com", bias: "CENTER", rssFeeds: ["https://www.ft.com/rss/home"] },
  { name: "The Economist", domain: "economist.com", bias: "CENTER", rssFeeds: ["https://www.economist.com/sections/united-states/rss.xml"] },
  { name: "USA Today", domain: "usatoday.com", bias: "CENTER", rssFeeds: ["http://rssfeeds.usatoday.com/usatoday-NewsTopStories"] },
  { name: "Christian Science Monitor", domain: "csmonitor.com", bias: "CENTER", rssFeeds: ["https://rss.csmonitor.com/feeds/all"] },
  { name: "The Week", domain: "theweek.com", bias: "CENTER", rssFeeds: ["https://theweek.com/rss"] },
  { name: "Politifact", domain: "politifact.com", bias: "CENTER", rssFeeds: ["https://www.politifact.com/rss/all/"] },

  // LEAN RIGHT
  { name: "Wall Street Journal", domain: "wsj.com", bias: "LEAN_RIGHT", rssFeeds: ["https://feeds.a.dj.com/rss/RSSWorldNews.xml", "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml"] },
  { name: "Fox News", domain: "foxnews.com", bias: "LEAN_RIGHT", rssFeeds: ["https://moxie.foxnews.com/google-publisher/latest.xml", "https://moxie.foxnews.com/google-publisher/world.xml"] },
  { name: "New York Post", domain: "nypost.com", bias: "LEAN_RIGHT", rssFeeds: ["https://nypost.com/feed/"] },
  { name: "Washington Examiner", domain: "washingtonexaminer.com", bias: "LEAN_RIGHT", rssFeeds: ["https://www.washingtonexaminer.com/tag/rss"] },
  { name: "National Review", domain: "nationalreview.com", bias: "LEAN_RIGHT", rssFeeds: ["https://www.nationalreview.com/feed/"] },
  { name: "The Dispatch", domain: "thedispatch.com", bias: "LEAN_RIGHT", rssFeeds: ["https://thedispatch.com/feed/"] },
  { name: "Reason", domain: "reason.com", bias: "LEAN_RIGHT", rssFeeds: ["https://reason.com/feed/"] },
  { name: "The Daily Wire", domain: "dailywire.com", bias: "LEAN_RIGHT", rssFeeds: ["https://www.dailywire.com/feeds/all-articles.xml"] },
  { name: "Daily Caller", domain: "dailycaller.com", bias: "LEAN_RIGHT", rssFeeds: ["https://dailycaller.com/feed/"] },
  { name: "The Federalist", domain: "thefederalist.com", bias: "LEAN_RIGHT", rssFeeds: ["https://thefederalist.com/feed/"] },

  // RIGHT
  { name: "Breitbart", domain: "breitbart.com", bias: "RIGHT", rssFeeds: ["https://feeds.feedburner.com/breitbart"] },
  { name: "Newsmax", domain: "newsmax.com", bias: "RIGHT", rssFeeds: ["https://www.newsmax.com/rss/Politics/1/"] },
  { name: "The Gateway Pundit", domain: "thegatewaypundit.com", bias: "RIGHT", rssFeeds: ["https://www.thegatewaypundit.com/feed/"] },
  { name: "Washington Times", domain: "washingtontimes.com", bias: "RIGHT", rssFeeds: ["https://www.washingtontimes.com/rss/headlines/news/"] },
  { name: "Epoch Times", domain: "theepochtimes.com", bias: "RIGHT", rssFeeds: ["https://www.theepochtimes.com/newsfeed/rss"] },

  // CENTER — International
  { name: "Al Jazeera", domain: "aljazeera.com", bias: "CENTER", country: "QA", rssFeeds: ["https://www.aljazeera.com/xml/rss/all.xml"] },
  { name: "Deutsche Welle", domain: "dw.com", bias: "CENTER", country: "DE", rssFeeds: ["https://rss.dw.com/rdf/rss-en-all"] },
  { name: "France 24", domain: "france24.com", bias: "CENTER", country: "FR", rssFeeds: ["https://www.france24.com/en/rss"] },
  { name: "Japan Times", domain: "japantimes.co.jp", bias: "CENTER", country: "JP", rssFeeds: ["https://www.japantimes.co.jp/feed/"] },
];

const topics = [
  { name: "Politics", slug: "politics", emoji: "🏛️", description: "Government, elections, and policy" },
  { name: "World", slug: "world", emoji: "🌍", description: "International news and events" },
  { name: "Business", slug: "business", emoji: "💼", description: "Economy, markets, and finance" },
  { name: "Technology", slug: "technology", emoji: "💻", description: "Tech, science, and innovation" },
  { name: "Health", slug: "health", emoji: "🏥", description: "Medicine, wellness, and public health" },
  { name: "Environment", slug: "environment", emoji: "🌿", description: "Climate, nature, and sustainability" },
  { name: "Culture", slug: "culture", emoji: "🎭", description: "Arts, entertainment, and society" },
  { name: "Sports", slug: "sports", emoji: "⚽", description: "Sports news and results" },
];

async function main() {
  console.log("Seeding topics...");
  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: {},
      create: topic,
    });
  }

  console.log("Seeding news sources...");
  for (const source of sources) {
    await prisma.source.upsert({
      where: { domain: source.domain },
      update: { rssFeeds: source.rssFeeds, bias: source.bias },
      create: {
        name: source.name,
        domain: source.domain,
        rssFeeds: source.rssFeeds,
        bias: source.bias,
        country: source.country || "US",
        logoUrl: source.logoUrl || `https://www.google.com/s2/favicons?domain=${source.domain}&sz=64`,
      },
    });
  }

  console.log(`Seeded ${sources.length} sources and ${topics.length} topics.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
