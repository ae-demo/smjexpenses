# SMJ Expenses — Design

A React SPA (`expense-webapp`) lets either household member sign in via Thunder SSO, log expenses in whatever currency they paid, and view shared totals. A Ballerina API (`expense-api`) owns the shared expense pool, categories, and limits in its own Postgres database, converting foreign-currency expenses into the household's USD base currency via the Frankfurter FX rate API using the historical rate on the date each expense was logged.

## Context (C1)

```mermaid
graph TD
  member[Household Member]
  system[SMJ Expenses]
  auth[Thunder Auth]
  fx[Frankfurter FX Rates]

  member -->|logs expenses, views totals| system
  system -->|sign-in / token validation| auth
  system -->|historical FX rate lookup| fx
```

## Domain model (ER)

```mermaid
erDiagram
  EXPENSE {
    string id PK
    string categoryId FK
    decimal amount
    string currency
    decimal amountUsd
    date expenseDate
    string loggedTimezone
    string loggedByUserId
    datetime createdAt
    datetime updatedAt
  }
  CATEGORY {
    string id PK
    string name
    decimal limitUsd
    datetime createdAt
  }
  CATEGORY ||--o{ EXPENSE : "groups"
```

`amountUsd` is computed once at write time: `amount` unchanged if `currency` is already USD, otherwise converted using the Frankfurter rate for `currency` -&gt; USD on `expenseDate`. Totals and limit checks always read `amountUsd`.

## Key flows

### Log an expense while traveling

```mermaid
sequenceDiagram
  actor HM as Household Member
  participant WEB as expense-webapp
  participant API as expense-api
  participant FX as Frankfurter
  participant DB as expense-db

  HM->>WEB: Enter amount, currency, category, date
  WEB->>API: POST /expenses
  alt currency != USD
    API->>FX: GET /{date}?base=currency&symbols=USD
    FX-->>API: historical rate
  end
  API->>API: compute amountUsd
  API->>DB: insert expense
  API-->>WEB: 201 Created
  WEB-->>HM: Expense added
```

### View category totals and limit status

```mermaid
sequenceDiagram
  actor HM as Household Member
  participant WEB as expense-webapp
  participant API as expense-api
  participant DB as expense-db

  HM->>WEB: Open category totals
  WEB->>API: GET /categories/totals?period=monthly
  API->>DB: sum amountUsd grouped by category
  DB-->>API: totals
  API-->>WEB: totals + limit + status (ok/near/over)
  WEB-->>HM: Progress bar per category
```

### View spending totals split by household member

