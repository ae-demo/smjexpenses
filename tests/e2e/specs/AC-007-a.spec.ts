// spec: tests/validation/test-plan.md § AC-007-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-007-a: a household member can set a limit on a category", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const categoryName = `AC-007-a-${Date.now()}`;

  // 1. New Category with a Monthly Limit
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "New Category" }).click();
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(categoryName);
  await page.getByRole("spinbutton", { name: "Monthly Limit", exact: false }).fill("123");
  await page.getByRole("button", { name: "Save Category" }).click();

  // Assert: the table shows the entered limit for this category
  await expect(page).toHaveURL(/\/categories$/);
  await expect(
    page.getByRole("row", { name: new RegExp(`${categoryName} .*123\\.00`) }),
  ).toBeVisible();
});
