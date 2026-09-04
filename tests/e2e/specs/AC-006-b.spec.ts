// spec: tests/validation/test-plan.md § AC-006-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-006-b: a household member can rename an existing category", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const originalName = `AC-006-b-${Date.now()}`;
  const renamedName = `${originalName}-renamed`;

  // Setup: create a category to rename.
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "New Category" }).click();
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(originalName);
  await page.getByRole("button", { name: "Save Category" }).click();
  await expect(page).toHaveURL(/\/categories$/);

  // 1. Open it and change the name
  await page.getByRole("row", { name: new RegExp(originalName) }).click();
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(renamedName);
  await page.getByRole("button", { name: "Save Category" }).click();

  // Assert: the table shows the renamed category, not the original name
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByRole("row", { name: new RegExp(renamedName) })).toBeVisible();
  await expect(page.getByRole("row", { name: originalName, exact: true })).toHaveCount(0);
});
