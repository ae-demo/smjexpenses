// spec: tests/validation/test-plan.md § AC-008-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-008-b: a category over its limit shows a visually distinct indicator", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const categoryName = `AC-008-b-${Date.now()}`;

  // Setup: a category with a low limit...
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "New Category" }).click();
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(categoryName);
  await page.getByRole("spinbutton", { name: "Monthly Limit", exact: false }).fill("10");
  await page.getByRole("button", { name: "Save Category" }).click();
  await expect(page).toHaveURL(/\/categories$/);

  // ...and an expense that exceeds it.
  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill("20");
  await page.getByRole("combobox", { name: "Category", exact: false }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save Expense" }).click();
  await expect(page).toHaveURL(/\/expenses$/);

  // 1. Back to Categories
  await page.getByRole("link", { name: "Categories" }).click();

  // Assert: its row shows the "Over Limit" badge
  const row = page.getByRole("row", { name: new RegExp(categoryName) });
  await expect(row.getByText("Over Limit")).toBeVisible();
});
