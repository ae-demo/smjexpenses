// spec: tests/validation/test-plan.md § AC-006-c
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-006-c: a household member can remove a category", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const categoryName = `AC-006-c-${Date.now()}`;

  // Setup: create a category to remove.
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "New Category" }).click();
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(categoryName);
  await page.getByRole("button", { name: "Save Category" }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByRole("row", { name: new RegExp(categoryName) })).toBeVisible();

  // 1. Open it, Delete, confirm
  await page.getByRole("row", { name: new RegExp(categoryName) }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete category" }).click();

  // Assert: the category no longer appears in the table
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByRole("row", { name: new RegExp(categoryName) })).toHaveCount(0);
});
