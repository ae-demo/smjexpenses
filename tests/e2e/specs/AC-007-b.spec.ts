// spec: tests/validation/test-plan.md § AC-007-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-007-b: a household member can change an existing category's limit", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const categoryName = `AC-007-b-${Date.now()}`;

  // Setup: a category with an initial limit.
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "New Category" }).click();
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(categoryName);
  await page.getByRole("spinbutton", { name: "Monthly Limit", exact: false }).fill("50");
  await page.getByRole("button", { name: "Save Category" }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(
    page.getByRole("row", { name: new RegExp(`${categoryName} .*50\\.00`) }),
  ).toBeVisible();

  // 1. Open it and change the limit
  await page.getByRole("row", { name: new RegExp(categoryName) }).click();
  await page.getByRole("spinbutton", { name: "Monthly Limit", exact: false }).fill("200");
  await page.getByRole("button", { name: "Save Category" }).click();

  // Assert: the table reflects the new limit
  await expect(page).toHaveURL(/\/categories$/);
  await expect(
    page.getByRole("row", { name: new RegExp(`${categoryName} .*200\\.00`) }),
  ).toBeVisible();
});
