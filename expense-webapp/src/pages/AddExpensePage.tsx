import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { DateInput } from "@astryxdesign/core/DateInput";
import { Button } from "@astryxdesign/core/Button";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Banner } from "@astryxdesign/core/Banner";
import { listCategories, createExpense } from "../api";
import type { Category } from "../api";
import { CURATED_CURRENCIES } from "../lib/currencies";
import { localTimezone, todayLocalISODate } from "../lib/date";

export default function AddExpensePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(todayLocalISODate());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then((res) => setCategories(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load categories."),
      )
      .finally(() => setIsLoadingCategories(false));
  }, []);

  async function handleSave() {
    if (!amount || !categoryId) {
      setError("Amount and category are required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await createExpense({
        categoryId,
        amount,
        currency,
        expenseDate: date,
        loggedTimezone: localTimezone(),
      });
      navigate("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense.");
      setIsSaving(false);
    }
  }

  return (
    <VStack gap={4} maxWidth={560}>
      <Heading level={1}>Add Expense</Heading>
      {error && <Banner status="error" title={error} />}
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
          isLoading={isLoadingCategories}
          placeholder="Choose a category"
          emptyText="No categories yet — create one on the Categories page"
          isRequired
        />
        <DateInput label="Date" value={date} onChange={(v) => v && setDate(v)} />
        <Text type="supporting" color="secondary">
          Recorded in your current local timezone ({localTimezone()})
        </Text>
      </FormLayout>
      <HStack gap={2} justify="end">
        <Button
          label="Cancel"
          variant="secondary"
          onClick={() => navigate("/expenses")}
        />
        <Button
          label="Save Expense"
          variant="primary"
          isLoading={isSaving}
          clickAction={handleSave}
        />
      </HStack>
    </VStack>
  );
}
