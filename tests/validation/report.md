# Validation report

- **Issue:** #7
- **Commit:** 28adf4c6ea5c5ccfa588b4fc23135c4ba4856750
- **Generated:** 2026-09-09T07:05:48.532Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 20 | 16 | 4 | 0 |
| manual (human checklist) | 2 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | An unauthenticated visitor cannot view expense data | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | A household member can sign in via SSO and reach the app | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-002-a | Submitting the add-expense form with amount, currency, category, and date creates the expense | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | healed ×1 |
| AC-003-a | A household member can edit an expense logged by the other household member | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | healed ×1 |
| AC-003-b | A household member can delete an expense logged by the other household member | ✅ pass | `tests/e2e/specs/AC-003-b.spec.ts` | healed ×1 |
| AC-004-a | The totals view shows a daily total | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | The totals view shows a weekly total | ✅ pass | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-004-c | The totals view shows a monthly total | ✅ pass | `tests/e2e/specs/AC-004-c.spec.ts` | — |
| AC-004-d | The totals chart breaks down spending by which household member logged it, in a stacked view | ✅ pass | `tests/e2e/specs/AC-004-d.spec.ts` | — |
| AC-005-a | The categories view shows a total per category | ✅ pass | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-006-a | A household member can create a new category | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-006-b | A household member can rename an existing category | ✅ pass | `tests/e2e/specs/AC-006-b.spec.ts` | — |
| AC-006-c | A household member can remove a category | ✅ pass | `tests/e2e/specs/AC-006-c.spec.ts` | — |
| AC-007-a | A household member can set a limit on a category | ✅ pass | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | A household member can change an existing category's limit | ✅ pass | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | A category under its limit does not show an over-limit indicator | ❌ fail | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-008-b | A category over its limit shows a visually distinct over-limit indicator | ❌ fail | `tests/e2e/specs/AC-008-b.spec.ts` | — |
| AC-009-a | A foreign-currency expense is included in USD-denominated totals and category summaries | ❌ fail | `tests/e2e/specs/AC-009-a.spec.ts` | healed ×1 |
| AC-009-b | The USD amount used for a foreign-currency expense reflects the exchange rate on that expense's logged date, not the current rate | ❌ fail | `tests/e2e/specs/AC-009-b.spec.ts` | healed ×1 |
| AC-010-a | An expense logged late at night in a traveler's local timezone is counted in that local day's total, even if it would fall on a different day in the household's home timezone | ✅ pass | `tests/e2e/specs/AC-010-a.spec.ts` | healed ×1 |

## Failures

### AC-008-a — A category under its limit does not show an over-limit indicator

Spec: `tests/e2e/specs/AC-008-a.spec.ts`
Location: `AC-008-a.spec.ts:5`

```
Test timeout of 30000ms exceeded.
```

### AC-008-b — A category over its limit shows a visually distinct over-limit indicator

Spec: `tests/e2e/specs/AC-008-b.spec.ts`
Location: `AC-008-b.spec.ts:5`

```
Test timeout of 30000ms exceeded.
```

### AC-009-a — A foreign-currency expense is included in USD-denominated totals and category summaries

Spec: `tests/e2e/specs/AC-009-a.spec.ts`
Location: `AC-009-a.spec.ts:6`

```
Test timeout of 30000ms exceeded.
```

### AC-009-b — The USD amount used for a foreign-currency expense reflects the exchange rate on that expense's logged date, not the current rate

Spec: `tests/e2e/specs/AC-009-b.spec.ts`
Location: `AC-009-b.spec.ts:33`

```
Test timeout of 30000ms exceeded.
```

## Manual checklist

- [ ] **AC-002-b** — The expense form does not require converting the amount to another currency before submitting
- [ ] **AC-008-c** — No proactive notification (email, push, SMS) is sent when a limit is crossed

## Healing log

| Criterion | Classification | Change | Commit |
|---|---|---|---|
| AC-003-a | locator drift | getByRole('option', { name: 'Food' }) -> select whatever the picker actually offers (added lib/category.ts#selectFirstAvailableCategory); the hardcoded seed category no longer falls within the picker's first limit=100 page on this shared, never-reset system | `63d6c8ea` |
| AC-003-b | locator drift | getByRole('option', { name: 'Food' }) -> select whatever the picker actually offers, same root cause as AC-003-a | `a94004ce` |
| AC-009-a | locator drift | getByRole('option', { name: 'Food' }) -> select whatever the picker actually offers, same root cause as AC-003-a | `51d15b15` |
| AC-009-b | locator drift | getByRole('option', { name: 'Food' }) -> select whatever the picker actually offers, once and reuse across both log calls; same root cause as AC-003-a | `653fc225` |
| AC-010-a | locator drift | getByRole('option', { name: 'Food' }) -> select whatever the picker actually offers, same root cause as AC-003-a | `6ccc4a2c` |
| AC-002-a | locator drift | getByRole('option', { name: 'Food' }) -> select whatever the picker actually offers, same root cause as AC-003-a (hit later, once more categories had accumulated) | `af78f76d` |

