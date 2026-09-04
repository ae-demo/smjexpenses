import { useEffect, useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/Stack";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Banner } from "@astryxdesign/core/Banner";
import { StackedBarChart } from "../components/StackedBarChart";
import { getPeriodTotals } from "../api";
import type { Period, PeriodTotal } from "../api";

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function TotalsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [buckets, setBuckets] = useState<PeriodTotal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getPeriodTotals(period)
      .then(setBuckets)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load totals."),
      )
      .finally(() => setIsLoading(false));
  }, [period]);

  const currentTotal = buckets.at(-1)?.totalUsd ?? 0;

  return (
    <VStack gap={4}>
      <Heading level={1}>Totals</Heading>
      <TabList value={period} onChange={(v) => setPeriod(v as Period)}>
        {PERIODS.map((p) => (
          <Tab key={p.value} value={p.value} label={p.label} />
        ))}
      </TabList>

      {error && <Banner status="error" title={error} />}

      {isLoading ? (
        <Spinner label="Loading totals…" />
      ) : (
        <>
          <StackedBarChart buckets={buckets} />
          <Card width={280}>
            <VStack gap={1}>
              <Text type="supporting" color="secondary">
                This period
              </Text>
              <Text type="display-2">${currentTotal.toFixed(2)}</Text>
              <Text type="supporting" color="secondary">
                across all categories
              </Text>
            </VStack>
          </Card>
        </>
      )}
    </VStack>
  );
}
