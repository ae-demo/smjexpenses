// spec: tests/validation/test-plan.md § AC-008-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-008-a: a category under its limit shows no over-limit indicator", async ({ page }) => {
  await loginAsHouseholdMember(page);
  const categoryName = `AC-008-a-${Date.now()}`;

  // Setup: a category with a high limit and no spend against it.
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "New Category" }).click();
  await page.getByRole("textbox", { name: "Category Name", exact: false }).fill(categoryName);
  await page.getByRole("spinbutton", { name: "Monthly Limit", exact: false }).fill("1000");
  await page.getByRole("button", { name: "Save Category" }).click();
  await expect(page).toHaveURL(/\/categories$/);

  // Assert: its row does not show the "Over Limit" badge
  const row = page.getByRole("row", { name: new RegExp(categoryName) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Over Limit")).toHaveCount(0);
});
