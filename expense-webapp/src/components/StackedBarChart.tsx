import { useMemo } from "react";
import { useTheme } from "@astryxdesign/core/theme";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import type { PeriodTotal } from "../api";

// No chart primitive ships in Astryx (astryx-design-system skill), so this
// draws an SVG bar chart directly and reads series colors from the active
// theme via useTheme — the documented escape hatch for non-CSS consumers
// like SVG/canvas charts — rather than hardcoding hex values.
const SERIES_TOKENS = [
  "--color-icon-blue",
  "--color-icon-green",
  "--color-icon-purple",
  "--color-icon-orange",
  "--color-icon-teal",
  "--color-icon-pink",
] as const;

const CHART_HEIGHT = 220;
const BAR_WIDTH = 40;
const BAR_GAP = 24;

export function StackedBarChart({ buckets }: { buckets: PeriodTotal[] }) {
  const { token } = useTheme();

  const userIds = useMemo(() => {
    const seen = new Map<string, string>();
    for (const bucket of buckets) {
      for (const entry of bucket.byUser) {
        if (!seen.has(entry.userId)) seen.set(entry.userId, entry.displayName);
      }
    }
    return [...seen.entries()];
  }, [buckets]);

  if (buckets.length === 0) {
    return (
      <EmptyState
        title="No spending in this period"
        description="Log an expense to see it charted here."
      />
    );
  }

  const max = Math.max(1, ...buckets.map((b) => b.totalUsd));
  const width = buckets.length * (BAR_WIDTH + BAR_GAP);
  const colorFor = (userId: string) =>
    token(SERIES_TOKENS[userIds.findIndex(([id]) => id === userId) % SERIES_TOKENS.length]);

  return (
    <VStack gap={3}>
      <svg
        role="img"
        aria-label="Spending over time, stacked by household member"
        width="100%"
        viewBox={`0 0 ${width} ${CHART_HEIGHT + 24}`}
        preserveAspectRatio="xMinYMid meet"
      >
        {buckets.map((bucket, index) => {
          let cumulative = 0;
          const x = index * (BAR_WIDTH + BAR_GAP);
          return (
            <g key={bucket.period}>
              {bucket.byUser.map((entry) => {
                const barHeight = (entry.totalUsd / max) * CHART_HEIGHT;
                const y = CHART_HEIGHT - cumulative - barHeight;
                cumulative += barHeight;
                return (
                  <rect
                    key={entry.userId}
                    x={x}
                    y={y}
                    width={BAR_WIDTH}
                    height={Math.max(0, barHeight)}
                    fill={colorFor(entry.userId)}
                  />
                );
              })}
              <text
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 18}
                textAnchor="middle"
                fontSize="11"
                fill={token("--color-text-secondary")}
              >
                {bucket.period}
              </text>
            </g>
          );
        })}
      </svg>
      <HStack gap={4} wrap="wrap">
        {userIds.map(([userId, displayName]) => (
          <HStack key={userId} gap={1.5} align="center">
            <svg width="10" height="10" aria-hidden="true">
              <rect width="10" height="10" fill={colorFor(userId)} />
            </svg>
            <Text type="supporting">{displayName}</Text>
          </HStack>
        ))}
      </HStack>
    </VStack>
  );
}
