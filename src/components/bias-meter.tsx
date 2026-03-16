"use client";

import { BiasCoverage, BIAS_COLORS, BIAS_LABELS } from "@/lib/bias/ratings";
import { BiasRating } from "@prisma/client";
import { cn } from "@/lib/utils";

interface BiasMeterProps {
  coverage: BiasCoverage[];
  showLabels?: boolean;
  className?: string;
}

const BIAS_ORDER: BiasRating[] = ["LEFT", "LEAN_LEFT", "CENTER", "LEAN_RIGHT", "RIGHT"];

export function BiasMeter({ coverage, showLabels = false, className }: BiasMeterProps) {
  const total = coverage.reduce((sum, c) => sum + c.count, 0);
  if (total === 0) return null;

  const orderedCoverage = BIAS_ORDER
    .map((bias) => coverage.find((c) => c.bias === bias))
    .filter(Boolean) as BiasCoverage[];

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        {orderedCoverage.map((item) => (
          <div
            key={item.bias}
            style={{
              width: `${(item.count / total) * 100}%`,
              backgroundColor: BIAS_COLORS[item.bias],
            }}
            title={`${item.label}: ${item.count} source${item.count !== 1 ? "s" : ""}`}
          />
        ))}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-2">
          {orderedCoverage.map((item) => (
            <span
              key={item.bias}
              className="inline-flex items-center gap-1 text-xs"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: BIAS_COLORS[item.bias] }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {item.label} ({item.count})
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface SourceBadgeProps {
  bias: BiasRating;
  className?: string;
}

export function SourceBadge({ bias, className }: SourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white",
        className
      )}
      style={{ backgroundColor: BIAS_COLORS[bias] }}
    >
      {BIAS_LABELS[bias]}
    </span>
  );
}
