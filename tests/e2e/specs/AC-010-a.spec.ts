// spec: tests/validation/test-plan.md § AC-010-a
//
// expense-webapp computes both the default Add-Expense date and the
// loggedTimezone it sends from the browser's own clock/zone
// (src/lib/date.ts: todayLocalISODate / localTimezone, both derived from
// `new Date()` / Intl.DateTimeFormat().resolvedOptions().timeZone). Playwright's
// timezoneId context option + Clock API deterministically control both, which
// is how this spec fixes "late at night, traveling" without waiting for a
// real midnight boundary.
import { test, expect } from "@playwright/test";

const TRAVELER_TZ = "Pacific/Honolulu"; // UTC-10
// 2026-09-05T09:00:00Z is 2026-09-04T23:00 local in Honolulu (late at
// night) but already 2026-09-05 in UTC — the app's neutral/home reference.
const FIXED_INSTANT = "2026-09-05T09:00:00Z";
const LOCAL_DATE = "2026-09-04";
const UTC_DATE = "2026-09-05";

test.use({ timezoneId: TRAVELER_TZ });

test("AC-010-a: a late-night local-timezone expense counts toward that local day", async ({ page }) => {
  // Unique per run — Date.now() here is the real Node clock, not the page's
  // fake one installed below, so this still varies across re-runs.
  const amount = (40 + (Date.now() % 900) / 100).toFixed(2);

  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  if (!username || !password) {
    throw new Error("AEP_E2E_USERNAME / AEP_E2E_PASSWORD not set");
  }
  await page.goto("/");
  // See lib/auth.ts: the redirect to Thunder can occasionally outrun the
  // default action timeout.
  await page.waitForURL(/\/gate\/signin/, { timeout: 30_000 });
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Add Expense" })).toBeVisible();

  // Freeze the clock only after the OIDC handshake completes: the IdP's own
  // token issuance/validation is time-sensitive (iat/exp, PKCE/session TTL),
  // and faking the browser clock before that exchange reliably broke the
  // redirect back from Thunder ("Invalid redirect URI").
  await page.clock.setFixedTime(new Date(FIXED_INSTANT));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Add Expense" })).toBeVisible();

  // 1. The Add Expense form defaults to the LOCAL date/zone, not UTC's.
  await expect(page.getByText(`(${TRAVELER_TZ})`)).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Date" })).toHaveValue("September 4, 2026");

  // 2. Log the expense (leaving the defaulted date as-is)
  await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill(amount);
  await page.getByRole("combobox", { name: "Category", exact: false }).click();
  await page.getByRole("option", { name: "Food" }).click();
  await page.getByRole("button", { name: "Save Expense" }).click();
  await expect(page).toHaveURL(/\/expenses$/);

  // Assert: it is filed under the traveler's local day, not the UTC day.
  await expect(
    page.getByRole("row", { name: new RegExp(`^${LOCAL_DATE} Food ${amount}`) }),
  ).toBeVisible();
  await expect(
    page.getByRole("row", { name: new RegExp(`^${UTC_DATE} Food ${amount}`) }),
  ).toHaveCount(0);
});
