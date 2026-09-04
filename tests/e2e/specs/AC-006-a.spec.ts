// spec: tests/validation/test-plan.md § AC-006-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-006-a: a household member can create a new category", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const categoryName = `AC-006-a-${Date.now()}`;

  // 1. Categories → New Category
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "New Category" }).click();
  // 2. Fill a unique name and save
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(categoryName);
  await page.getByRole("button", { name: "Save Category" }).click();

  // Assert: the new category appears in the table
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByRole("row", { name: new RegExp(categoryName) })).toBeVisible();
});
