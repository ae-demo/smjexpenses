import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { DateInput } from "@astryxdesign/core/DateInput";
import { Button } from "@astryxdesign/core/Button";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Banner } from "@astryxdesign/core/Banner";
import { Spinner } from "@astryxdesign/core/Spinner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import {
  listCategories,
  listExpenses,
  updateExpense,
  deleteExpense,
} from "../api";
import type { Category } from "../api";
import { CURATED_CURRENCIES } from "../lib/currencies";
import { localTimezone, type ISODateString } from "../lib/date";

export default function EditExpensePage() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<ISODateString | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expenseId) return;
    Promise.all([listCategories(), listExpenses({})])
      .then(([categoriesRes, expensesRes]) => {
        setCategories(categoriesRes.data);
        const expense = expensesRes.data.find((e) => e.id === expenseId);
        if (!expense) {
          setError("This expense could not be found.");
          return;
        }
        setAmount(expense.amount);
        setCurrency(expense.currency);
        setCategoryId(expense.categoryId);
        setDate(expense.expenseDate as ISODateString);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load expense."),
      )
      .finally(() => setIsLoading(false));
  }, [expenseId]);

  async function handleSave() {
    if (!expenseId || !amount || !categoryId || !date) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateExpense(expenseId, {
        categoryId,
        amount,
        currency,
        expenseDate: date,
        loggedTimezone: localTimezone(),
      });
      navigate("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!expenseId) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseId);
      navigate("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete expense.");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  }

  if (isLoading) {
    return <Spinner label="Loading expense…" />;
  }

  return (
    <VStack gap={4} maxWidth={560}>
      <Heading level={1}>Edit Expense</Heading>
      {error && <Banner status="error" title={error} />}
      {amount !== null && (
        <>
          <FormLayout direction="vertical">
            <NumberInput
              label="Amount"
              value={amount}
              onChange={setAmount}
              min={0}
              step={0.01}
              isRequired
            />
            <Selector
              label="Currency"
              options={[...CURATED_CURRENCIES]}
              value={currency}
              onChange={setCurrency}
            />
            <Selector
              label="Category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onChange={setCategoryId}
              isRequired
            />
            <DateInput
              label="Date"
              value={date}
              onChange={(v) => v && setDate(v)}
            />
          </FormLayout>
          <HStack justify="between">
            <Button
              label="Delete"
              variant="destructive"
              onClick={() => setIsDeleteOpen(true)}
            />
            <HStack gap={2}>
              <Button
                label="Cancel"
                variant="secondary"
                onClick={() => navigate("/expenses")}
              />
              <Button
                label="Save Changes"
                variant="primary"
                isLoading={isSaving}
                clickAction={handleSave}
              />
            </HStack>
          </HStack>
        </>
      )}
      <AlertDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this expense?"
        description="This removes it from the shared household pool for everyone. This cannot be undone."
        actionLabel="Delete expense"
        isActionLoading={isDeleting}
        onAction={handleDelete}
      />
    </VStack>
  );
}
