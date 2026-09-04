screen AddExpense "Log a new expense quickly"
  navbar "SMJ Expenses | Add Expense -> AddExpense | Expenses -> ExpenseList | Totals -> Totals | Categories -> Categories"
  heading "Add Expense"
  input "Amount"
  select "Currency"
  select "Category"
  input "Date"
  text "Recorded in your current local timezone"
  row
    right
    button "Cancel"
    button "Save Expense" primary

screen ExpenseList "The shared household expense pool"
  navbar "SMJ Expenses | Add Expense -> AddExpense | Expenses -> ExpenseList | Totals -> Totals | Categories -> Categories"
  row
    heading "Expenses"
    right
    button "Add Expense" primary -> AddExpense
  row
    select "Category"
    input "From"
    input "To"
  table "Date | Category | Amount Paid | Currency | USD | Logged By"
    row "2026-09-02 | Groceries | 84.20 | USD | 84.20 | You"
    row "2026-08-28 | Dining | 32.00 | EUR | 34.50 | Wife"
  text "Tap a row to edit or delete" -> EditExpense

screen EditExpense "Correct an expense either of you logged"
  navbar "SMJ Expenses | Add Expense -> AddExpense | Expenses -> ExpenseList | Totals -> Totals | Categories -> Categories"
  heading "Edit Expense"
  input "Amount"
  select "Currency"
  select "Category"
  input "Date"
  row
    button "Delete" danger
    right
    button "Cancel" -> ExpenseList
    button "Save Changes" primary -> ExpenseList

screen Totals "Daily, weekly, and monthly household spending"
  navbar "SMJ Expenses | Add Expense -> AddExpense | Expenses -> ExpenseList | Totals -> Totals | Categories -> Categories"
  heading "Totals"
  tabs "Daily | Weekly | Monthly"
  chart "Spending over time" 600x260
  card "This period | $412.60 | across all categories"

screen Categories "Category totals, limits, and management"
  navbar "SMJ Expenses | Add Expense -> AddExpense | Expenses -> ExpenseList | Totals -> Totals | Categories -> Categories"
  row
    heading "Categories"
    right
    button "New Category" primary -> EditCategory
  table "Category | Spent (USD) | Limit (USD) | Status"
    row "Groceries | 410.00 | 500.00 | On Track"
    row "Dining | 340.00 | 300.00 | Over Limit"
  progress "Groceries 82%"
  badge "Over Limit" danger
  text "Tap a category to rename it or change its limit" -> EditCategory

screen EditCategory "Create or edit a category and its limit"
  navbar "SMJ Expenses | Add Expense -> AddExpense | Expenses -> ExpenseList | Totals -> Totals | Categories -> Categories"
  heading "Category Details"
  input "Category Name"
  input "Monthly Limit (USD)"
  row
    button "Delete" danger
    right
    button "Cancel" -> Categories
    button "Save Category" primary -> Categories

flow "Log and review spending"
  role "Household Member"
  description "Either household member logs an expense, reviews the shared list, and checks totals"
  AddExpense
  ExpenseList
  EditExpense
  Totals

flow "Manage categories and limits"
  role "Household Member"
  description "Either household member sets up categories and limits, and checks limit status"
  Categories
  EditCategory
