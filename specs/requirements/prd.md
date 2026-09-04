# SMJ Expenses — PRD

## Problem Statement

Tracking household spending today means scattered receipts, memory, or a spreadsheet nobody updates consistently. There is no easy way to log an expense the moment it happens, see where the money is going by category, or know when spending in a category is creeping past what the household intended to spend. Both members of the household need to contribute expense records and see the full picture — not just one person's private ledger.

## Solution

A personal expense-tracking web application for a household of two. Either member can quickly log an expense against a category, and both see the same shared view of spending — daily, weekly, and monthly totals, and totals broken down by category — against limits they set per category.

## Actors

- **Household Member**: Either person in the household (both have identical permissions). Can sign in, log expenses, edit or delete any expense in the shared pool, view spending totals and visualizations, manage categories, and set per-category limits.

## User Stories

1. As a Household Member, I want to sign in securely, so that only my household can access our expense data.
2. As a Household Member, I want to add an expense with an amount, category, and date, so that I can quickly record spending as it happens.
3. As a Household Member, I want to edit or delete any expense in our shared record, so that either of us can correct a mistake regardless of who logged it.
4. As a Household Member, I want to view our daily, weekly, and monthly expenditure totals, so that I can track how our spending trends over time.
5. As a Household Member, I want to view totals grouped by category, so that I can see where our household's money goes.
6. As a Household Member, I want to create, rename, and remove expense categories, so that our categories match how we actually think about our spending.
7. As a Household Member, I want to set a spending limit for each category, so that we can budget deliberately.
8. As a Household Member, I want to see a clear visual indicator when a category is near or over its limit, so that I know to rein in spending without doing the math myself.

## Product Decisions

- Both household members sign in via SSO through Thunder, the platform IDP (org default).
- Expenses are a single shared household pool — every expense either member logs is visible to, and editable by, both. There is no per-person private view.
- Both household members have identical permissions; there is no admin/contributor distinction.
- Limit status is surfaced as a visual indicator (e.g. a progress bar or color state) on the category totals view, checked whenever that view is opened — there is no proactive notification (e.g. email or push) when a limit is crossed.
- All amounts are tracked in a single household currency. *assumed*
- Expense categories are freely defined by the household, not drawn from a fixed preset list. *assumed*

## Out of Scope

- Multi-currency support.
- Recurring/scheduled expenses (e.g. auto-logging a monthly subscription).
- Proactive notifications or alerts (email, push, SMS) for limit breaches.
- Support for households of more than two members.
- Income tracking, budget forecasting, or bank account integration/import.

## Open Questions

1. None outstanding — all decisions needed to write this PRD were either answered directly or assumed and flagged above.

## Further Notes

None.