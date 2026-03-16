import { extract } from "@extractus/article-extractor";
import * as cheerio from "cheerio";
import axios from "axios";

export interface ExtractedArticle {
  title: string | null;
  content: string | null;
  description: string | null;
  image: string | null;
  author: string | null;
  published: string | null;
  readingTime: number | null;
}

const PAYWALL_INDICATORS = [
  "subscribe to read",
  "subscription required",
  "become a member",
  "sign in to read",
  "premium content",
  "subscribers only",
];

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  try {
    const result = await extract(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SimplyStory/1.0; +https://simplystory.news)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!result) throw new Error("No result from extractor");

    const content = result.content || null;
    const readingTime = content
      ? Math.ceil(content.split(/\s+/).length / 200)
      : null;

    return {
      title: result.title || null,
      content,
      description: result.description || null,
      image: result.image || null,
      author: result.author || null,
      published: result.published || null,
      readingTime,
    };
  } catch {
    // Fallback to cheerio
    return extractWithCheerio(url);
  }
}

async function extractWithCheerio(url: string): Promise<ExtractedArticle> {
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SimplyStory/1.0; +https://simplystory.news)",
    },
    timeout: 10000,
    maxContentLength: 5 * 1024 * 1024, // 5MB max
  });

  const $ = cheerio.load(response.data);

  // Remove noise
  $("script, style, nav, footer, header, aside, .ad, .advertisement, .social-share, .comments").remove();

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    null;

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;

  const image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null;

  const author =
    $('meta[name="author"]').attr("content") ||
    $('[rel="author"]').first().text().trim() ||
    null;

  const published =
    $('meta[property="article:published_time"]').attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    null;

  // Extract main content
  const contentSelectors = [
    "article",
    '[role="main"]',
    ".article-body",
    ".article-content",
    ".story-body",
    ".post-content",
    "main",
  ];

  let content = "";
  for (const selector of contentSelectors) {
    const el = $(selector).first();
    if (el.length && el.text().length > 200) {
      content = el.text().replace(/\s+/g, " ").trim();
      break;
    }
  }

  // Paywall detection
  const bodyText = $("body").text().toLowerCase();
  const isPaywalled = PAYWALL_INDICATORS.some((indicator) =>
    bodyText.includes(indicator)
  );

  if (isPaywalled && content.length < 500) {
    throw new Error("PAYWALLED");
  }

  const readingTime = content
    ? Math.ceil(content.split(/\s+/).length / 200)
    : null;

  return { title, content: content || null, description, image, author, published, readingTime };
}
