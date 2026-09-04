// spec: tests/validation/test-plan.md § AC-004-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-004-a: the totals view shows a daily total", async ({ page }) => {
  await loginAsHouseholdMember(page);

  // 1. Open Totals (Daily is the default tab)
  await page.getByRole("link", { name: "Totals" }).click();

  // Assert: a period total is shown for the daily view
  await expect(page.getByText("This period")).toBeVisible();
  await expect(page.getByText(/^\$\d/)).toBeVisible();
});
