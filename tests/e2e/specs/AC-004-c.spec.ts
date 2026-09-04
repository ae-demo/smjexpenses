// spec: tests/validation/test-plan.md § AC-004-c
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-004-c: the totals view shows a monthly total", async ({ page }) => {
  await loginAsHouseholdMember(page);

  // 1. Open Totals, switch to Monthly
  await page.getByRole("link", { name: "Totals" }).click();
  await page.getByRole("button", { name: "Monthly" }).click();

  // Assert: a period total is shown, keyed to a year-month bucket. The
  // chart accumulates one bucket per month of logged history, so scope to
  // the first bucket rather than requiring exactly one on the axis.
  await expect(page.getByText("This period")).toBeVisible();
  await expect(page.getByText(/^\$\d/)).toBeVisible();
  await expect(page.getByText(/^\d{4}-\d{2}$/).first()).toBeVisible();
});
