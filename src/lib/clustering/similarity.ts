// TF-IDF based title similarity for story clustering

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "it", "in", "on", "at", "to", "for",
  "of", "and", "or", "but", "with", "by", "from", "as", "be",
  "was", "are", "were", "has", "have", "had", "will", "would",
  "could", "should", "may", "might", "do", "does", "did", "not",
  "this", "that", "these", "those", "he", "she", "they", "we",
  "his", "her", "their", "its", "my", "your", "our",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

export function areSameStory(
  titleA: string,
  titleB: string,
  threshold = 0.25
): boolean {
  return jaccardSimilarity(titleA, titleB) >= threshold;
}

export function pickBestTitle(titles: string[]): string {
  // Pick the most informative title (longest that isn't clickbait-y)
  const sorted = [...titles].sort((a, b) => {
    const scoreA = titleScore(a);
    const scoreB = titleScore(b);
    return scoreB - scoreA;
  });
  return sorted[0];
}

function titleScore(title: string): number {
  let score = title.length;
  // Penalize clickbait patterns
  const clickbaitPhrases = [
    "you won't believe",
    "shocking",
    "breaking",
    "watch:",
    "must see",
    "this is why",
    "here's why",
    "find out",
    "revealed",
  ];
  for (const phrase of clickbaitPhrases) {
    if (title.toLowerCase().includes(phrase)) score -= 50;
  }
  // Penalize ALL CAPS words (shouting)
  const capsWords = title.split(" ").filter((w) => w === w.toUpperCase() && w.length > 3);
  score -= capsWords.length * 10;
  return score;
}
