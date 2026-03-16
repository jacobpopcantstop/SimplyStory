import { BiasRating } from "@prisma/client";

export const BIAS_LABELS: Record<BiasRating, string> = {
  LEFT: "Left",
  LEAN_LEFT: "Lean Left",
  CENTER: "Center",
  LEAN_RIGHT: "Lean Right",
  RIGHT: "Right",
  UNKNOWN: "Unknown",
};

export const BIAS_COLORS: Record<BiasRating, string> = {
  LEFT: "#1a56db",
  LEAN_LEFT: "#76a9fa",
  CENTER: "#6b7280",
  LEAN_RIGHT: "#f98080",
  RIGHT: "#e02424",
  UNKNOWN: "#9ca3af",
};

export const BIAS_ORDER: BiasRating[] = [
  "LEFT",
  "LEAN_LEFT",
  "CENTER",
  "LEAN_RIGHT",
  "RIGHT",
  "UNKNOWN",
];

export interface BiasCoverage {
  bias: BiasRating;
  label: string;
  color: string;
  count: number;
}

export function getBiasCoverage(
  articles: Array<{ source: { bias: BiasRating } }>
): BiasCoverage[] {
  const counts = new Map<BiasRating, number>();
  for (const article of articles) {
    const bias = article.source.bias;
    counts.set(bias, (counts.get(bias) || 0) + 1);
  }

  return BIAS_ORDER.filter((b) => counts.has(b)).map((bias) => ({
    bias,
    label: BIAS_LABELS[bias],
    color: BIAS_COLORS[bias],
    count: counts.get(bias) || 0,
  }));
}

export function hasBlindSpot(
  articles: Array<{ source: { bias: BiasRating } }>
): boolean {
  const biases = new Set(articles.map((a) => a.source.bias));
  const political: BiasRating[] = ["LEFT", "LEAN_LEFT", "LEAN_RIGHT", "RIGHT"];
  const covered = political.filter((b) => biases.has(b));
  // Blind spot: only left-leaning or only right-leaning coverage
  const hasLeft = covered.some((b) => b === "LEFT" || b === "LEAN_LEFT");
  const hasRight = covered.some((b) => b === "RIGHT" || b === "LEAN_RIGHT");
  return covered.length > 0 && !(hasLeft && hasRight);
}
