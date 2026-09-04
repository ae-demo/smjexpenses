import createClient from "openapi-fetch";
import type { paths } from "./generated/expense-api";
import { getAccessToken, signIn } from "./auth";

// Same-origin: nginx proxies /api to expense-api, preferring the gateway
// address (validated token, injected identity) over the direct Service.
const client = createClient<paths>({ baseUrl: "/api" });

// The contract requires an X-User-Id header, but the gateway is the one
// authority allowed to assert it — it re-derives it from the validated
// bearer token and nginx clears any value the browser sends (see
// nginx/15-aep-api-proxy.sh). This placeholder only satisfies the generated
// type; it never reaches expense-api unmodified.
const GATEWAY_ASSIGNED = "gateway-assigned";

async function authHeaders(): Promise<{ Authorization?: string; "X-User-Id": string }> {
  const token = await getAccessToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-User-Id": GATEWAY_ASSIGNED,
  };
}

/** Wraps an openapi-fetch call: attaches the bearer token, and on 401 restarts sign-in. */
export async function withAuth<T>(
  run: (headers: { Authorization?: string; "X-User-Id": string }) => Promise<{
    data?: T;
    error?: unknown;
    response: Response;
  }>,
): Promise<T> {
  const headers = await authHeaders();
  const { data, error, response } = await run(headers);
  if (response.status === 401) {
    await signIn();
    throw new Error("Session expired; redirecting to sign-in.");
  }
  if (error) {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export { client as expenseApi };

type Expense = import("./generated/expense-api").components["schemas"]["Expense"];
type Category = import("./generated/expense-api").components["schemas"]["Category"];
type ExpenseInput = import("./generated/expense-api").components["schemas"]["ExpenseInput"];
type CategoryTotal = import("./generated/expense-api").components["schemas"]["CategoryTotal"];
type PeriodTotal = import("./generated/expense-api").components["schemas"]["PeriodTotal"];
type Period = "daily" | "weekly" | "monthly";

export async function listExpenses(filter: {
  categoryId?: string;
  from?: string;
  to?: string;
}): Promise<{ count: number; data: Expense[] }> {
  return withAuth((headers) =>
    client.GET("/expenses", {
      params: { header: headers, query: { limit: 100, ...filter } },
    }),
  );
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  return withAuth((headers) =>
    client.POST("/expenses", { params: { header: headers }, body: input }),
  );
}

export async function updateExpense(
  expenseId: string,
  input: ExpenseInput,
): Promise<Expense> {
  return withAuth((headers) =>
    client.PUT("/expenses/{expenseId}", {
      params: { header: headers, path: { expenseId } },
      body: input,
    }),
  );
}

export async function deleteExpense(expenseId: string): Promise<void> {
  return withAuth((headers) =>
    client.DELETE("/expenses/{expenseId}", {
      params: { header: headers, path: { expenseId } },
    }),
  );
}

export async function listCategories(): Promise<{ count: number; data: Category[] }> {
  return withAuth((headers) =>
    client.GET("/categories", {
      params: { header: headers, query: { limit: 100 } },
    }),
  );
}

export async function createCategory(input: {
  name: string;
  limitUsd?: number | null;
}): Promise<Category> {
  return withAuth((headers) =>
    client.POST("/categories", { params: { header: headers }, body: input }),
  );
}

export async function updateCategory(
  categoryId: string,
  input: { name?: string; limitUsd?: number | null },
): Promise<Category> {
  return withAuth((headers) =>
    client.PUT("/categories/{categoryId}", {
      params: { header: headers, path: { categoryId } },
      body: input,
    }),
  );
}

export async function deleteCategory(categoryId: string): Promise<void> {
  return withAuth((headers) =>
    client.DELETE("/categories/{categoryId}", {
      params: { header: headers, path: { categoryId } },
    }),
  );
}

export async function getPeriodTotals(period: Period): Promise<PeriodTotal[]> {
  return withAuth((headers) =>
    client.GET("/totals", { params: { header: headers, query: { period } } }),
  );
}

export async function getCategoryTotals(period: Period): Promise<CategoryTotal[]> {
  return withAuth((headers) =>
    client.GET("/categories/totals", {
      params: { header: headers, query: { period } },
    }),
  );
}

export type { Expense, Category, ExpenseInput, CategoryTotal, PeriodTotal, Period };
