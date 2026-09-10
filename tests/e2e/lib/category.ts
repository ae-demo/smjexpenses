import type { Page } from "@playwright/test";

// The live category picker only ever fetches the first page of categories
// (see tests/validation/heal notes for AC-003-a/b, AC-009-a/b, AC-010-a): the
// shared system has accumulated well past that page size across validation
// cycles, so a hardcoded seed name like "Food" is no longer guaranteed to be
// among the options actually rendered. None of these criteria care WHICH
// category an expense is filed under, so pick whatever the picker actually
// offers instead of a literal that the live app may have paged out.
export async function selectFirstAvailableCategory(page: Page): Promise<string> {
  await page.getByRole("combobox", { name: "Category", exact: false }).click();
  const option = page.getByRole("option").first();
  const name = (await option.textContent())?.trim() ?? "";
  await option.click();
  return name;
}
