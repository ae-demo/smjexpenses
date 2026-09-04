// spec: tests/validation/test-plan.md § AC-005-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-005-a: the categories view shows a total per category", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const categoryName = `AC-005-a-${Date.now()}`;

  // Setup: a fresh category with a known expense logged against it, so the
  // assertion doesn't depend on pre-existing environment data.
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "New Category" }).click();
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(categoryName);
  await page.getByRole("button", { name: "Save Category" }).click();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill("15.00");
  await page.getByRole("combobox", { name: "Category", exact: false }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save Expense" }).click();
  await expect(page).toHaveURL(/\/expenses$/);

  // 1. Open Categories
  await page.getByRole("link", { name: "Categories" }).click();

  // Assert: the table has a spent-per-category column and this category's
  // row shows its numeric spent total.
  await expect(page.getByRole("columnheader", { name: "Spent (USD)" })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName} 15\\.00`) })).toBeVisible();
});
