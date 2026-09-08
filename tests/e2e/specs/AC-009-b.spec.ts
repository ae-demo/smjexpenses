// spec: tests/validation/test-plan.md § AC-009-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";
import { selectFirstAvailableCategory } from "../lib/category";

// Two past dates far enough apart that Frankfurter's EUR->USD rate on each
// almost certainly differs, so a wrong implementation that always uses
// "today's" rate produces the same USD amount for both.
const OLDER_DATE = { year: 2026, month: "June", day: "1", iso: "2026-06-01" };
const NEWER_DATE = { year: 2026, month: "August", day: "15", iso: "2026-08-15" };

async function fetchHistoricalUsdRate(request: import("@playwright/test").APIRequestContext, date: string) {
  const res = await request.get(`https://api.frankfurter.dev/v1/${date}?base=EUR&symbols=USD`);
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { rates: { USD: number } };
  return body.rates.USD;
}

async function selectDate(page: import("@playwright/test").Page, month: string, day: string) {
  await page.getByRole("button", { name: "Open calendar" }).click();
  // Scoped to the calendar dialog: the same "<Month> <Year>" text is also
  // announced in a separate live region, which would otherwise make this a
  // strict-mode-violating locator.
  const dialog = page.getByRole("dialog", { name: "Choose date" });
  const heading = dialog.getByText(new RegExp(`^${month} \\d{4}$`));
  // Navigate back until the target month is showing (dates are in the past).
  for (let i = 0; i < 12 && !(await heading.isVisible()); i++) {
    await page.getByRole("button", { name: "Previous month" }).click();
  }
  await page.getByRole("button", { name: new RegExp(`${month} ${day}, \\d{4}`) }).click();
}

test("AC-009-b: the USD amount reflects the exchange rate on the logged date", async ({ page, request }) => {
  // Verify independently, against the real FX source, that the two dates
  // used below actually carry different rates — otherwise the assertion
  // below would be vacuous.
  const olderRate = await fetchHistoricalUsdRate(request, OLDER_DATE.iso);
  const newerRate = await fetchHistoricalUsdRate(request, NEWER_DATE.iso);
  expect(olderRate).not.toBe(newerRate);

  await loginAsHouseholdMember(page);

  // Unique amount so this run's rows are unambiguous among pre-existing data
  // left by earlier validation runs against this same live system (a fixed
  // "100" collided with rows an earlier cycle had already created).
  const amount = (20 + (Date.now() % 900) / 100).toFixed(2);

  // Fixed across both log calls: the picker's ordering only depends on
  // existing categories, which don't change mid-test, so the same category
  // is offered both times.
  let category = "";

  async function logEurExpense(month: string, day: string): Promise<void> {
    // Scoped to the top nav landmark: the Expenses list page also shows its
    // own "Add Expense" CTA button, which otherwise makes this a
    // strict-mode-violating locator.
    await page.getByLabel("Primary").getByRole("link", { name: "Add Expense" }).click();
    await page.getByRole("spinbutton", { name: "Amount", exact: false }).fill(amount);
    await page.getByRole("combobox", { name: "Currency", exact: false }).click();
    await page.getByRole("option", { name: "EUR", exact: true }).click();
    category = await selectFirstAvailableCategory(page);
    await selectDate(page, month, day);
    await page.getByRole("button", { name: "Save Expense" }).click();
    await expect(page).toHaveURL(/\/expenses$/);
  }

  await logEurExpense(OLDER_DATE.month, OLDER_DATE.day);
  const olderRow = page.getByRole("row", { name: new RegExp(`${OLDER_DATE.iso} ${category} ${amount} EUR`) });
  await expect(olderRow).toBeVisible();
  const olderUsdText = await olderRow.getByRole("cell").nth(4).textContent();

  await logEurExpense(NEWER_DATE.month, NEWER_DATE.day);
  const newerRow = page.getByRole("row", { name: new RegExp(`${NEWER_DATE.iso} ${category} ${amount} EUR`) });
  await expect(newerRow).toBeVisible();
  const newerUsdText = await newerRow.getByRole("cell").nth(4).textContent();

  // Assert: the two USD amounts differ, tracking the historical rates (not
  // both computed off a single "current" rate).
  expect(olderUsdText).not.toBe(newerUsdText);
  const expectedOlder = (Number(amount) * olderRate).toFixed(2);
  const expectedNewer = (Number(amount) * newerRate).toFixed(2);
  expect(olderUsdText?.trim()).toBe(expectedOlder);
  expect(newerUsdText?.trim()).toBe(expectedNewer);
});
