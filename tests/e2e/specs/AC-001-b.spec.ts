// spec: tests/validation/test-plan.md § AC-001-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-001-b: a household member can sign in via SSO and reach the app", async ({ page }) => {
  // 1-2. Sign in via Thunder; loginAsHouseholdMember waits for the app shell
  await loginAsHouseholdMember(page);
  // 3. The primary nav confirms we reached the app, not just a login page
  await expect(page.getByRole("link", { name: "Expenses" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Totals" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Categories" })).toBeVisible();
});
