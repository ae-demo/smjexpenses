# Validation report

- **Issue:** #7
- **Commit:** 14eb55ded04073c6cba9683b015772446ca29dc7
- **Generated:** 2026-09-04T06:15:49.902Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 20 | 20 | 0 | 0 |
| manual (human checklist) | 2 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | An unauthenticated visitor cannot view expense data | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | A household member can sign in via SSO and reach the app | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-002-a | Submitting the add-expense form with amount, currency, category, and date creates the expense | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-003-a | A household member can edit an expense logged by the other household member | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-003-b | A household member can delete an expense logged by the other household member | ✅ pass | `tests/e2e/specs/AC-003-b.spec.ts` | — |
| AC-004-a | The totals view shows a daily total | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | The totals view shows a weekly total | ✅ pass | `tests/e2e/specs/AC-004-b.spec.ts` | healed ×1 |
| AC-004-c | The totals view shows a monthly total | ✅ pass | `tests/e2e/specs/AC-004-c.spec.ts` | healed ×1 |
| AC-004-d | The totals chart breaks down spending by which household member logged it, in a stacked view | ✅ pass | `tests/e2e/specs/AC-004-d.spec.ts` | — |
| AC-005-a | The categories view shows a total per category | ✅ pass | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-006-a | A household member can create a new category | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-006-b | A household member can rename an existing category | ✅ pass | `tests/e2e/specs/AC-006-b.spec.ts` | — |
| AC-006-c | A household member can remove a category | ✅ pass | `tests/e2e/specs/AC-006-c.spec.ts` | — |
| AC-007-a | A household member can set a limit on a category | ✅ pass | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | A household member can change an existing category's limit | ✅ pass | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | A category under its limit does not show an over-limit indicator | ✅ pass | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-008-b | A category over its limit shows a visually distinct over-limit indicator | ✅ pass | `tests/e2e/specs/AC-008-b.spec.ts` | — |
| AC-009-a | A foreign-currency expense is included in USD-denominated totals and category summaries | ✅ pass | `tests/e2e/specs/AC-009-a.spec.ts` | healed ×1 |
| AC-009-b | The USD amount used for a foreign-currency expense reflects the exchange rate on that expense's logged date, not the current rate | ✅ pass | `tests/e2e/specs/AC-009-b.spec.ts` | healed ×2 |
| AC-010-a | An expense logged late at night in a traveler's local timezone is counted in that local day's total, even if it would fall on a different day in the household's home timezone | ✅ pass | `tests/e2e/specs/AC-010-a.spec.ts` | healed ×1 |

## Manual checklist

- [ ] **AC-002-b** — The expense form does not require converting the amount to another currency before submitting
- [ ] **AC-008-c** — No proactive notification (email, push, SMS) is sent when a limit is crossed

## Healing log

| Criterion | Classification | Change | Commit |
|---|---|---|---|
| AC-009-b | locator drift | getByRole('link', { name: 'Add Expense' }) -> getByLabel('Primary').getByRole('link', { name: 'Add Expense' }); the Expenses list page also renders its own "Add Expense" CTA button, so the unscoped locator resolved to 2 elements once the test navigated back to /expenses between the two submissions | `636f6e96` |
| AC-009-b | data collision | fixed amount "100" -> unique amount derived from Date.now(), matching the AC-002-a convention; a fixed 2026-06-01/2026-08-15 Food 100 EUR row already existed on the shared live system from an earlier validation cycle, producing a strict-mode duplicate-row violation on assertion | `636f6e96` |
| AC-009-a | data collision | fixed amount "50" -> unique amount derived from Date.now(); a fixed-amount row from an earlier run in this same session already existed, producing a strict-mode duplicate-row violation on assertion | `7ee109b6` |
| AC-004-b | locator drift | getByText(/^\d{4}-W\d{2}$/) -> .first(); the weekly totals chart now accumulates one x-axis bucket per week of logged history (multiple weeks of test data exist on this live system), so the unscoped locator resolved to 3 elements instead of the single bucket the spec assumed when authored | `7ee109b6` |
| AC-004-c | locator drift | getByText(/^\d{4}-\d{2}$/) -> .first(); same accumulated-history cause as AC-004-b, one bucket per month | `7ee109b6` |
| AC-010-a | timing | moved page.clock.setFixedTime(...) from before the OIDC login redirect to after it (with a page.reload() to pick up the frozen clock on the Add Expense form); freezing the browser clock before the Thunder handshake reliably broke the redirect back with "Invalid request: Invalid redirect URI" — reproduced twice in a row before the change, passed twice in a row after, and the same error appeared transiently on other specs with no clock manipulation at all (confirming the underlying gate error is real but the clock ordering made this spec hit it deterministically) | `14eb55de` |

