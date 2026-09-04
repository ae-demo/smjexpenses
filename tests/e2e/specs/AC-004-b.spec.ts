// spec: tests/validation/test-plan.md § AC-004-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-004-b: the totals view shows a weekly total", async ({ page }) => {
  await loginAsHouseholdMember(page);

  // 1. Open Totals, switch to Weekly
  await page.getByRole("link", { name: "Totals" }).click();
  await page.getByRole("button", { name: "Weekly" }).click();

  // Assert: a period total is shown, keyed to an ISO week bucket
  await expect(page.getByText("This period")).toBeVisible();
  await expect(page.getByText(/^\$\d/)).toBeVisible();
  await expect(page.getByText(/^\d{4}-W\d{2}$/)).toBeVisible();
});
