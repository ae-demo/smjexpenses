// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";

test("AC-001-a: an unauthenticated visitor cannot view expense data", async ({ page }) => {
  // 1. Navigate to / with no prior session
  await page.goto("/");
  // 2. The app bounces the browser to Thunder's hosted sign-in page. This
  // goes through a failed silent-renew attempt first (oidc-client-ts), which
  // takes noticeably longer than the default assertion timeout.
  await page.waitForURL(/\/gate\/signin/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  // 3. No expense data is ever rendered
  await expect(page.getByRole("heading", { name: "Add Expense" })).toHaveCount(0);
});
