# SMJ Expenses — e2e validation test plan

Target: `expense-webapp` (primary, proxies `/api/*` to `expense-api`), issue #7.

Auth: Thunder OIDC Authorization Code + PKCE. An unauthenticated visit to any
route bounces the same tab to Thunder's hosted "Gate" login form
(`Username` / `Password` textboxes, "Sign In" button); after sign-in the
browser lands back on the SPA. Credentials: the roles gate ticket (#3)
provisions exactly one role/account, `Household Member` /
`test-household-member` (cold start). Read from `AEP_E2E_USERNAME` /
`AEP_E2E_PASSWORD` via `lib/auth.ts#loginAsHouseholdMember`.

**Single test account caveat.** REQ-003 requires that *either* household
member can edit/delete an expense the *other* logged. Only one account was
provisioned, so AC-003-a/b cannot log in as two distinct people. The deployed
API/UI place no ownership check on `PUT`/`DELETE /expenses/{id}` (confirmed
by exploration: the Edit Expense screen offers Save/Delete on any row with no
"not yours" gate, and the OpenAPI contract defines no 403 for this path) —
so the closest automatable proxy is: edit/delete an expense that already
exists in the shared pool and assert it succeeds with no ownership
prompt/error. Noted as a caveat in the report rather than silently passed.

**Known live-app defect found during exploration (not itself a criterion):**
a hard refresh / direct navigation to a nested route (e.g. `/categories/new`)
fails with "window._env_ not set" because `env-config.js` is requested
relative to the current path instead of the site root. All specs below
navigate via in-app link/button clicks from `/`, as a real user would,
which does not hit this. Recorded in the report notes.

**Known live-app defect found during exploration (blocks REQ-009):** every
non-USD `POST /expenses` fails with `400 {"message":"could not convert
currency to USD","description":"Not Found"}`, regardless of currency or
date (confirmed directly against `expense-api`, and independently confirmed
Frankfurter itself answers the same historical-date query fine) — the
service cannot reach/parse its FX dependency. AC-009-a/b are authored to
exercise the real flow and will fail honestly against the live app.

## AC-001-a — An unauthenticated visitor cannot view expense data

- Target: expense-webapp (primary)
- Steps:
  1. Fresh, unauthenticated context: navigate to `/`
  2. Observe the redirect to Thunder's hosted login
- Assert: a "Sign In" heading is visible (on the IdP page) and no
  expense-webapp content ("Add Expense" heading) is ever rendered
- Source of truth: `thunder-authentication` SKILL.md (OIDC redirect) +
  live exploration (`/` → `.../gate/signin`)

## AC-001-b — A household member can sign in via SSO and reach the app

- Target: expense-webapp (primary)
- Steps:
  1. Navigate to `/`; fill Thunder's Username/Password; click Sign In
  2. Observe landing back on the SPA
- Assert: "Add Expense" heading visible, primary nav (Expenses/Totals/
  Categories) visible
- Source of truth: live exploration

## AC-002-a — Submitting the add-expense form creates the expense

- Target: expense-webapp (primary)
- Steps:
  1. Sign in; on Add Expense, fill Amount, Currency (USD), Category, Date
  2. Save
- Assert: navigation to `/expenses` and a row with the entered amount/
  currency/category/date is visible
- Source of truth: `expense-webapp/src/pages/AddExpensePage.tsx` + live
  exploration

## AC-003-a — A household member can edit an expense logged by the other member

- Target: expense-webapp (primary)
- Steps:
  1. Sign in; create an expense (setup)
  2. Open it from the Expenses list, change the amount, Save Changes
- Assert: the updated amount is reflected in the Expenses list
- Caveat: single test account — see plan header
- Source of truth: live exploration (Edit Expense screen)

## AC-003-b — A household member can delete an expense logged by the other member

- Target: expense-webapp (primary)
- Steps:
  1. Sign in; create an expense (setup)
  2. Open it, click Delete, confirm "Delete expense"
- Assert: the row is no longer in the Expenses list
- Caveat: single test account — see plan header

## AC-004-a — The totals view shows a daily total

- Target: expense-webapp (primary)
- Steps: Sign in; go to Totals; Daily tab (default)
- Assert: "This period" total (`$…`) is visible under the Daily tab

## AC-004-b — The totals view shows a weekly total

- Target: expense-webapp (primary)
- Steps: Sign in; go to Totals; click Weekly
- Assert: a period total is visible and the chart's week-period label
  (`2026-Www` pattern) is shown

## AC-004-c — The totals view shows a monthly total

- Target: expense-webapp (primary)
- Steps: Sign in; go to Totals; click Monthly
- Assert: a period total is visible and the chart's month-period label
  (`YYYY-MM` pattern) is shown

## AC-004-d — The totals chart is stacked by household member

- Target: expense-webapp (primary)
- Steps: Sign in; go to Totals
- Assert: chart accessible name is "Spending over time, stacked by
  household member" and a legend entry for the signed-in member's
  username is visible

## AC-005-a — The categories view shows a total per category

- Target: expense-webapp (primary)
- Steps: Sign in; go to Categories
- Assert: the categories table has a "Spent (USD)" column and at least
  one category row shows a numeric spent total

## AC-006-a — A household member can create a new category

- Target: expense-webapp (primary)
- Steps: Sign in; Categories → New Category; fill a unique name; Save
- Assert: the new category appears in the Categories table

## AC-006-b — A household member can rename an existing category

- Target: expense-webapp (primary)
- Steps: create a category (setup); open it; change the name; Save
- Assert: the renamed category appears in the table under the new name

## AC-006-c — A household member can remove a category

- Target: expense-webapp (primary)
- Steps: create a category (setup); open it; Delete; confirm "Delete
  category"
- Assert: the category no longer appears in the table

## AC-007-a — A household member can set a limit on a category

- Target: expense-webapp (primary)
- Steps: Categories → New Category; fill name + Monthly Limit; Save
- Assert: the Categories table shows the entered limit for that row

## AC-007-b — A household member can change an existing category's limit

- Target: expense-webapp (primary)
- Steps: create a category with a limit (setup); open it; change the
  limit; Save
- Assert: the table reflects the new limit value

## AC-008-a — A category under its limit shows no over-limit indicator

- Target: expense-webapp (primary)
- Steps: create a category with a high limit and no/low spend (setup)
- Assert: its table row does NOT show the "Over Limit" badge

## AC-008-b — A category over its limit shows a visually distinct indicator

- Target: expense-webapp (primary)
- Steps: create a category with a low limit (setup); log an expense
  against it exceeding the limit
- Assert: its table row shows the "Over Limit" badge

## AC-009-a — A foreign-currency expense is included in USD totals

- Target: expense-webapp (primary)
- Steps: Sign in; Add Expense with a non-USD currency (EUR); Save
- Assert: expense is created and its USD amount contributes to totals
- Expected to fail honestly: live `expense-api` returns 400
  ("could not convert currency to USD") for every non-USD amount —
  see plan header

## AC-009-b — The USD amount reflects the exchange rate on the logged date

- Target: expense-webapp (primary)
- Steps: create two EUR expenses of the same amount on two dates with
  different historical Frankfurter rates (verified independently via
  the `request` fixture against the real Frankfurter API); compare
  their USD amounts
- Assert: the two USD amounts differ in the direction the historical
  rates predict (not both computed off "today's" rate)
- Expected to fail honestly: creation itself 400s — see plan header

## AC-010-a — A late-night local-timezone expense counts toward that local day

- Target: expense-webapp (primary)
- Steps: emulate browser timezone `Pacific/Honolulu` (UTC-10) with the
  clock fixed to `2026-09-05T09:00:00Z` (23:00 local on 2026-09-04, but
  already 2026-09-05 in UTC — the app's neutral/home reference); Add
  Expense; confirm the default Date and the "current local timezone"
  hint reflect the LOCAL date/zone; save; confirm the expense lists
  under `2026-09-04`, not `2026-09-05`
- Assert: expense date shown is the local day, not the UTC day
- Source of truth: `expense-webapp/src/lib/date.ts` (`todayLocalISODate`,
  `localTimezone` both derive from the JS engine's local clock/zone,
  which Playwright's `timezoneId` + clock APIs control deterministically)

## Manual criteria (rendered as checklist, not automated)

- AC-002-b — the expense form does not require a currency conversion
  before submitting
- AC-008-c — no proactive notification is sent when a limit is crossed

## Re-validation cycle (2026-09-04, issue #7 reopened after fix #9/#11)

Ran the full committed regression set (all 20 e2e specs already existed;
none authored fresh this cycle) against the redeployed system.

**REQ-009 fix confirmed.** AC-009-a and AC-009-b, previously failing
because `expense-api` could not reach its Frankfurter dependency, both
pass now — the "could not convert currency to USD" 400 is gone and the
USD amount tracks the historical rate on the expense's logged date, not
today's rate.

**Brittleness found and healed (all against the live app, not spec bugs
in what they assert — see `tests/e2e/heal-log.json` for the mechanical
record):**

- AC-009-b, AC-009-a — fixed literal amounts (`100`, `50`) collided with
  rows an earlier run had already created on this same shared, un-reset
  live system. Switched both to a `Date.now()`-derived unique amount,
  matching the convention AC-002-a already used.
- AC-009-b — `getByRole("link", { name: "Add Expense" })` became
  ambiguous once the test returned to `/expenses` between its two
  submissions: that page renders its own "Add Expense" CTA button
  alongside the persistent top-nav link. Scoped to the nav landmark
  (`getByLabel("Primary")`).
- AC-004-b, AC-004-c — the weekly/monthly totals chart now accumulates
  one x-axis bucket per period of logged history (this run's own
  AC-009/AC-010 specs log expenses on fixed past dates), so the exact
  single-bucket locator the spec was authored against became a
  strict-mode multi-match. Scoped to `.first()` — the criterion only
  requires a bucket in the right format, not exactly one.
- AC-010-a — freezing the page clock (`page.clock.setFixedTime`) *before*
  the OIDC login redirect reliably broke the return trip from Thunder
  with "Invalid redirect URI", reproduced twice in a row. Moved the
  freeze to after login completes (plus a reload so the Add Expense form
  picks up the frozen clock), which passed twice in a row after.

**Unrelated transient flake, not healed (no spec touched):** the same
Thunder gate error above appeared once each, non-reproducibly, on
AC-004-d, AC-005-a, AC-007-a and AC-007-b across this cycle's runs, with
no clock manipulation involved and no locator change needed — a focused
re-run of each passed immediately. Treated as live IdP/session flake
under this session's back-to-back logins, not a defect to report.

**Caveats carried over, still true:** the single-test-account limitation
on AC-003-a/b, and the nested-route `env-config.js` routing defect, both
described above — neither re-verified this cycle since neither result
changed.

Result: 20/20 e2e criteria pass.

## Re-validation cycle (2026-09-06, issue #7 judged again)

Re-ran the full committed regression set (all 20 e2e specs, none authored
or healed fresh this cycle) against the redeployed system. All 20 passed
on the first attempt, no brittleness encountered, no heal-log entries
added.

**Caveats carried over, unchanged:** the single-test-account limitation on
AC-003-a/b, and the nested-route `env-config.js` routing defect, both
described above — neither re-verified this cycle since neither result
changed.

Result: 20/20 e2e criteria pass.

## Re-validation cycle (2026-09-08, issue #7 judged again)

Re-ran the full committed regression set against the redeployed system.
The initial full run failed 5 specs (AC-003-a/b, AC-009-a/b, AC-010-a) on
`getByRole('option', { name: 'Food' })` timing out. Live re-drive (direct
`GET /api/categories?limit=100`) found the root cause: this shared,
never-reset system has accumulated **102+ categories** — almost entirely
throwaway ones created by every prior validation cycle's AC-006/007/008
specs, which create categories but mostly never delete them — and the
category picker only ever fetches the first page (`limit=100`, no further
fetch, no type-ahead filter, no infinite scroll: confirmed live, typing
into the combobox does not filter it and scrolling the listbox to its end
fires no follow-up request). The response does carry `count` and a `next`
cursor (`/categories?limit=100&offset=100`) — the frontend just never
follows it. Sorted alphabetically ascending, the seed `Food` category (and
anything else sorting late) is now permanently past the cutoff.

None of AC-002-a, AC-003-a/b, AC-009-a/b, or AC-010-a care *which*
category is used, so this is brittleness in the test's literal, not a
result the criterion depends on — healed by selecting whatever the picker
actually offers instead of a hardcoded name (see heal-log; also applied to
AC-002-a, which hit the identical failure on a later run once more
categories had accumulated in between).

**Newly found, genuine defect (same root cause, not healed):** the
**same** `limit=100`-with-no-follow-through pattern exists on
`GET /api/expenses`, sorted by `expenseDate` descending, now past **117
total expenses**. AC-009-b deliberately logs expenses dated far in the
past (2026-06-01, 2026-08-15) to prove historical-FX-rate handling;
verified live (direct `POST /expenses` + immediate `GET /expenses`) that a
just-created expense dated 2026-06-01 does not appear anywhere in the
returned page, because enough more-recently-*dated* expenses (mostly
today-dated, from every cycle's other specs) now fill the entire window.
This will only get worse: every cycle adds ~10 more today-dated expenses
and never removes any. A household member genuinely cannot view, and
therefore cannot audit, an older expense's computed USD amount once this
threshold is crossed — there is no search/pagination affordance on the
Expenses page either. Not healed: AC-009-b's criterion is specifically
about the recorded USD amount for a *past-dated* expense, which is exactly
what this defect makes unobservable. (Aggregates are unaffected: `/totals`
and `/categories/totals` are separate, unpaginated, server-computed
endpoints, confirmed live — so AC-004/AC-005/AC-007/AC-008's own
assertions, which read from those, are not at risk from this.)

**AC-008-b failed for the same defect, also not healed:** it creates a
fresh category and must select that *same* category on the Add Expense
form to log the over-limit expense — by design, it can't substitute a
different, already-reachable category the way AC-002-a/003/009-a/010-a
could. Once the category pool crossed the cutoff for entries sorting as
late as `AC-008-b-*`, the freshly created category became unreachable in
the picker, identically to the `Food` case above. The category itself is
created fine and is fully visible on the Categories page (which reads the
unpaginated `/categories/totals` endpoint) — only the Add-Expense picker
can't reach it.

**AC-001-a and AC-001-b failed on the final authoritative run** with
Thunder's `invalid_request: Invalid redirect URI` gate error during
login — the same non-reproducible IdP flake noted in the 2026-09-04 cycle
report (there, it hit 4 different specs once each; a bare re-run cleared
it every time, no code change). The heal budget (2 focused re-run waves)
was already spent on the category-picker defect above by the time this
appeared on the final run, so per the healing discipline this was left as
the authoritative, reported result rather than chased with a further,
budget-exceeding re-run. Likely the same flake, not re-verified this
cycle.

**Caveats carried over, unchanged:** the single-test-account limitation on
AC-003-a/b, and the nested-route `env-config.js` routing defect, both
described above.

Result: 16/20 e2e criteria pass (2 genuine failures: AC-008-b, AC-009-b;
2 suspected-transient IdP-flake failures: AC-001-a, AC-001-b).
