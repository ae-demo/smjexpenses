import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// The app delegates sign-in to Thunder (OIDC Authorization Code + PKCE): an
// unauthenticated visit to any route bounces the browser, same-tab, to the
// Thunder "Gate" hosted login form. Credentials come only from the
// milestone's roles gate ticket, exported into the environment by the
// validation workflow — never hardcoded here.
export async function loginAsHouseholdMember(page: Page): Promise<void> {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "AEP_E2E_USERNAME / AEP_E2E_PASSWORD not set — export the household member test login before running this spec",
    );
  }

  await page.goto("/");
  // The redirect to Thunder goes through a failed silent-renew attempt first
  // (oidc-client-ts) and occasionally a slow IdP response, both of which can
  // outrun the default action timeout — wait for the gate explicitly.
  await page.waitForURL(/\/gate\/signin/, { timeout: 30_000 });
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Add Expense" })).toBeVisible();
}
