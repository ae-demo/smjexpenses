// spec: tests/validation/test-plan.md § AC-003-b
//
// Caveat: only one household-member test account was provisioned (see
// tests/validation/test-plan.md header), so this exercises the same
// no-ownership-check delete path any household member would use on an
// expense already in the shared pool.
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-003-b: a household member can delete an expense in the shared pool", async ({ page }) => {
  await loginAsHouseholdMember(page);

  // Setup: log an expense to delete.
  const amount = (30 + (Date.now() % 900) / 100).toFixed(2);
  await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill(amount);
  await page.getByRole("combobox", { name: "Category", exact: false }).click();
  await page.getByRole("option", { name: "Food" }).click();
  await page.getByRole("button", { name: "Save Expense" }).click();
  await expect(page).toHaveURL(/\/expenses$/);
  const row = page.getByRole("row", { name: new RegExp(`Food ${amount} USD`) });
  await expect(row).toBeVisible();

  // 1. Open it and delete
  await row.click();
  await expect(page.getByRole("heading", { name: "Edit Expense" })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete expense" }).click();

  // Assert: the row is gone from the shared list — no ownership prompt/error
  // blocked it.
  await expect(page).toHaveURL(/\/expenses$/);
  await expect(page.getByRole("row", { name: new RegExp(`Food ${amount} USD`) })).toHaveCount(0);
});
