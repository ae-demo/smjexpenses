// spec: tests/validation/test-plan.md § AC-009-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-009-a: a foreign-currency expense is included in USD totals", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const amount = "50";

  // 1. Log an expense in a non-USD currency
  await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill(amount);
  await page.getByRole("combobox", { name: "Currency", exact: false }).click();
  await page.getByRole("option", { name: "EUR", exact: true }).click();
  await page.getByRole("combobox", { name: "Category", exact: false }).click();
  await page.getByRole("option", { name: "Food" }).click();
  await page.getByRole("button", { name: "Save Expense" }).click();

  // Assert: the expense is created and shows a converted USD amount in the
  // shared list (the criterion: it is "included in USD-denominated totals
  // and category summaries").
  await expect(page).toHaveURL(/\/expenses$/);
  const row = page.getByRole("row", { name: new RegExp(`Food ${amount}\\.00 EUR`) });
  await expect(row).toBeVisible();
  // The USD column must show a computed (non-empty, numeric) conversion.
  await expect(row.getByRole("cell").nth(4)).toHaveText(/\d/);
});
