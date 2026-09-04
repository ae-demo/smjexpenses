// spec: tests/validation/test-plan.md § AC-002-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-002-a: submitting the add-expense form creates the expense", async ({ page }) => {
  await loginAsHouseholdMember(page);

  // Unique amount so this run's row is unambiguous among pre-existing data.
  const amount = (10 + (Date.now() % 900) / 100).toFixed(2);

  // 1. Fill amount, currency, category, date on the Add Expense form
  await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill(amount);
  await page.getByRole("combobox", { name: "Category", exact: false }).click();
  await page.getByRole("option", { name: "Food" }).click();
  // Currency defaults to USD and Date defaults to today — both required by
  // the criterion and left as-is.

  // 2. Save
  await page.getByRole("button", { name: "Save Expense" }).click();

  // Assert: creation succeeds (redirect to the shared Expenses list) and the
  // new row is visible with the entered amount/currency/category.
  await expect(page).toHaveURL(/\/expenses$/);
  const row = page.getByRole("row", { name: new RegExp(`Food ${amount} USD`) });
  await expect(row).toBeVisible();
});
