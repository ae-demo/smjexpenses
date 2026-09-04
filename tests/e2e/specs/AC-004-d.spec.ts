// spec: tests/validation/test-plan.md § AC-004-d
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-004-d: the totals chart is stacked by household member", async ({ page }) => {
  await loginAsHouseholdMember(page);

  // 1. Open Totals
  await page.getByRole("link", { name: "Totals" }).click();

  // Assert: the chart's accessible name declares it stacked by member, and
  // a legend entry names the signed-in member.
  await expect(
    page.getByRole("img", { name: "Spending over time, stacked by household member" }),
  ).toBeVisible();
  const username = process.env.AEP_E2E_USERNAME;
  if (username) {
    await expect(page.getByText(username, { exact: true })).toBeVisible();
  }
});
