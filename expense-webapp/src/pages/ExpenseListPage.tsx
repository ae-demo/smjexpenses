import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as stylex from "@stylexjs/stylex";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { DateInput } from "@astryxdesign/core/DateInput";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Banner } from "@astryxdesign/core/Banner";
import { listCategories, listExpenses } from "../api";
import type { Category, Expense } from "../api";
import type { ISODateString } from "../lib/date";

const styles = stylex.create({
  clickableRow: {
    cursor: "pointer",
  },
});

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [from, setFrom] = useState<ISODateString | undefined>(undefined);
  const [to, setTo] = useState<ISODateString | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then((res) => setCategories(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    listExpenses({
      categoryId: categoryId || undefined,
      from,
      to,
    })
      .then((res) => setExpenses(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load expenses."),
      )
      .finally(() => setIsLoading(false));
  }, [categoryId, from, to]);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center">
        <Heading level={1}>Expenses</Heading>
        <Button label="Add Expense" variant="primary" href="/" />
      </HStack>

      <HStack gap={3} wrap="wrap">
        <Selector
          label="Category"
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={categoryId}
          onChange={setCategoryId}
          width={220}
        />
        <DateInput
          label="From"
          value={from}
          onChange={setFrom}
          hasClear
          width={200}
        />
        <DateInput label="To" value={to} onChange={setTo} hasClear width={200} />
      </HStack>

      {error && <Banner status="error" title={error} />}

      {isLoading ? (
        <Spinner label="Loading expenses…" />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Log an expense or adjust the filters above."
        />
      ) : (
        <>
          <Table hasHover dividers="rows" isStriped>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Amount Paid</TableHeaderCell>
                <TableHeaderCell>Currency</TableHeaderCell>
                <TableHeaderCell>USD</TableHeaderCell>
                <TableHeaderCell>Logged By</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  onClick={() => navigate(`/expenses/${expense.id}`)}
                  {...stylex.props(styles.clickableRow)}
                >
                  <TableCell>{expense.expenseDate}</TableCell>
                  <TableCell>{categoryName(expense.categoryId)}</TableCell>
                  <TableCell>{expense.amount.toFixed(2)}</TableCell>
                  <TableCell>{expense.currency}</TableCell>
                  <TableCell>{expense.amountUsd.toFixed(2)}</TableCell>
                  <TableCell>{expense.loggedByName ?? expense.loggedByUserId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Text type="supporting" color="secondary">
            Tap a row to edit or delete
          </Text>
        </>
      )}
    </VStack>
  );
}
