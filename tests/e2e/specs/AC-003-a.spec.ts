// spec: tests/validation/test-plan.md § AC-003-a
//
// Caveat: only one household-member test account was provisioned (see
// tests/validation/test-plan.md header), so this exercises the same
// no-ownership-check edit path any household member would use on an
// expense already in the shared pool.
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-003-a: a household member can edit an expense in the shared pool", async ({ page }) => {
  await loginAsHouseholdMember(page);

  // Setup: log an expense to edit.
  const originalAmount = (20 + (Date.now() % 900) / 100).toFixed(2);
  await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill(originalAmount);
  await page.getByRole("combobox", { name: "Category", exact: false }).click();
  await page.getByRole("option", { name: "Food" }).click();
  await page.getByRole("button", { name: "Save Expense" }).click();
  await expect(page).toHaveURL(/\/expenses$/);

  // 1. Open the newly logged expense from the shared list
  await page.getByRole("row", { name: new RegExp(`Food ${originalAmount} USD`) }).click();
  await expect(page.getByRole("heading", { name: "Edit Expense" })).toBeVisible();

  // 2. Change the amount and save
  const newAmount = (Number(originalAmount) + 5).toFixed(2);
  await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill(newAmount);
  await page.getByRole("button", { name: "Save Changes" }).click();

  // Assert: the shared list reflects the edit — no ownership prompt/error
  // blocked it.
  await expect(page).toHaveURL(/\/expenses$/);
  await expect(page.getByRole("row", { name: new RegExp(`Food ${newAmount} USD`) })).toBeVisible();
});
