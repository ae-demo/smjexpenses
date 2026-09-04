import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as stylex from "@stylexjs/stylex";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Button } from "@astryxdesign/core/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@astryxdesign/core/Table";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Banner } from "@astryxdesign/core/Banner";
import { getCategoryTotals } from "../api";
import type { CategoryTotal } from "../api";

const styles = stylex.create({
  clickableRow: {
    cursor: "pointer",
  },
});

const STATUS_LABEL: Record<CategoryTotal["status"], string> = {
  ok: "On Track",
  near: "Near Limit",
  over: "Over Limit",
};

const STATUS_PROGRESS_VARIANT: Record<
  CategoryTotal["status"],
  "accent" | "warning" | "error"
> = {
  ok: "accent",
  near: "warning",
  over: "error",
};

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CategoryTotal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategoryTotals("monthly")
      .then(setRows)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load categories."),
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center">
        <Heading level={1}>Categories</Heading>
        <Button label="New Category" variant="primary" href="/categories/new" />
      </HStack>

      {error && <Banner status="error" title={error} />}

      {isLoading ? (
        <Spinner label="Loading categories…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create a category to start tracking spending against a limit."
        />
      ) : (
        <>
          <Table hasHover dividers="rows" isStriped>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Spent (USD)</TableHeaderCell>
                <TableHeaderCell>Limit (USD)</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.categoryId}
                  onClick={() => navigate(`/categories/${row.categoryId}`)}
                  {...stylex.props(styles.clickableRow)}
                >
                  <TableCell>{row.categoryName}</TableCell>
                  <TableCell>{row.totalUsd.toFixed(2)}</TableCell>
                  <TableCell>
                    {row.limitUsd != null ? row.limitUsd.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell>
                    {row.limitUsd != null ? (
                      <VStack gap={1} maxWidth={160}>
                        <ProgressBar
                          label={`${row.categoryName} spending`}
                          isLabelHidden
                          value={row.totalUsd}
                          max={row.limitUsd}
                          variant={STATUS_PROGRESS_VARIANT[row.status]}
                          hasValueLabel
                        />
                        {row.status !== "ok" && (
                          <Badge
                            label={STATUS_LABEL[row.status]}
                            variant={row.status === "over" ? "error" : "warning"}
                          />
                        )}
                      </VStack>
                    ) : (
                      <Text type="supporting" color="secondary">
                        No limit set
                      </Text>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Text type="supporting" color="secondary">
            Tap a category to rename it or change its limit
          </Text>
        </>
      )}
    </VStack>
  );
}
