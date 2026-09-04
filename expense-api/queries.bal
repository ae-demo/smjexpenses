import ballerina/sql;

// ---- Categories ----------------------------------------------------------

function findCategoryById(string categoryId) returns Category?|error {
    sql:ParameterizedQuery query = `SELECT id, name, limit_usd AS "limitUsd" FROM categories WHERE id = ${categoryId}`;
    Category|error result = dbClient->queryRow(query);
    if result is Category {
        return result;
    }
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

function categoryExists(string categoryId) returns boolean|error {
    Category? category = check findCategoryById(categoryId);
    return category is Category;
}

function listCategoryRows(int 'limit, int offset) returns Category[]|error {
    sql:ParameterizedQuery query = `SELECT id, name, limit_usd AS "limitUsd" FROM categories
        ORDER BY name ASC LIMIT ${'limit} OFFSET ${offset}`;
    stream<Category, sql:Error?> resultStream = dbClient->query(query);
    Category[] rows = [];
    check from Category row in resultStream
        do {
            rows.push(row);
        };
    return rows;
}

function countCategories() returns int|error {
    int total = check dbClient->queryRow(`SELECT COUNT(*) FROM categories`);
    return total;
}

function insertCategory(string id, string name, decimal? limitUsd) returns error? {
    _ = check dbClient->execute(`
        INSERT INTO categories (id, name, limit_usd) VALUES (${id}, ${name}, ${limitUsd})
    `);
}

function updateCategoryRow(string categoryId, string name, decimal? limitUsd) returns error? {
    _ = check dbClient->execute(`
        UPDATE categories SET name = ${name}, limit_usd = ${limitUsd} WHERE id = ${categoryId}
    `);
}

function deleteCategoryRow(string categoryId) returns int|error {
    sql:ExecutionResult result = check dbClient->execute(`DELETE FROM categories WHERE id = ${categoryId}`);
    int? affected = result.affectedRowCount;
    return affected is int ? affected : 0;
}

// ---- Expenses -------------------------------------------------------------

final sql:ParameterizedQuery EXPENSE_SELECT = `SELECT id, category_id AS "categoryId", amount, currency,
    amount_usd AS "amountUsd", to_char(expense_date, 'YYYY-MM-DD') AS "expenseDate",
    logged_timezone AS "loggedTimezone", logged_by_user_id AS "loggedByUserId",
    logged_by_name AS "loggedByName",
    to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
    FROM expenses`;

function findExpenseById(string expenseId) returns Expense?|error {
    sql:ParameterizedQuery query = sql:queryConcat(EXPENSE_SELECT, ` WHERE id = ${expenseId}`);
    Expense|error result = dbClient->queryRow(query);
    if result is Expense {
        return result;
    }
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

function expenseFilterClause(string? categoryId, string? fromDate, string? toDate) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery clause = ` WHERE 1=1`;
    if categoryId is string {
        clause = sql:queryConcat(clause, ` AND category_id = ${categoryId}`);
    }
    if fromDate is string {
        clause = sql:queryConcat(clause, ` AND expense_date >= ${fromDate}::date`);
    }
    if toDate is string {
        clause = sql:queryConcat(clause, ` AND expense_date <= ${toDate}::date`);
    }
    return clause;
}

function listExpenseRows(int 'limit, int offset, string? categoryId, string? fromDate, string? toDate) returns Expense[]|error {
    sql:ParameterizedQuery query = sql:queryConcat(EXPENSE_SELECT, expenseFilterClause(categoryId, fromDate, toDate));
    query = sql:queryConcat(query, ` ORDER BY expense_date DESC, created_at DESC LIMIT ${'limit} OFFSET ${offset}`);
    stream<Expense, sql:Error?> resultStream = dbClient->query(query);
    Expense[] rows = [];
    check from Expense row in resultStream
        do {
            rows.push(row);
        };
    return rows;
}

function countExpenseRows(string? categoryId, string? fromDate, string? toDate) returns int|error {
    sql:ParameterizedQuery query = sql:queryConcat(`SELECT COUNT(*) FROM expenses`, expenseFilterClause(categoryId, fromDate, toDate));
    int total = check dbClient->queryRow(query);
    return total;
}

function insertExpense(string id, string categoryId, decimal amount, string currency, decimal amountUsd,
        string expenseDate, string loggedTimezone, string loggedByUserId, string loggedByName) returns error? {
    _ = check dbClient->execute(`
        INSERT INTO expenses (id, category_id, amount, currency, amount_usd, expense_date, logged_timezone,
            logged_by_user_id, logged_by_name)
        VALUES (${id}, ${categoryId}, ${amount}, ${currency}, ${amountUsd}, ${expenseDate}::date, ${loggedTimezone},
            ${loggedByUserId}, ${loggedByName})
    `);
}

function updateExpenseRow(string expenseId, string categoryId, decimal amount, string currency, decimal amountUsd,
        string expenseDate, string loggedTimezone) returns error? {
    _ = check dbClient->execute(`
        UPDATE expenses SET category_id = ${categoryId}, amount = ${amount}, currency = ${currency},
            amount_usd = ${amountUsd}, expense_date = ${expenseDate}::date, logged_timezone = ${loggedTimezone},
            updated_at = now()
        WHERE id = ${expenseId}
    `);
}

function deleteExpenseRow(string expenseId) returns int|error {
    sql:ExecutionResult result = check dbClient->execute(`DELETE FROM expenses WHERE id = ${expenseId}`);
    int? affected = result.affectedRowCount;
    return affected is int ? affected : 0;
}

// ---- Totals -----------------------------------------------------------

function periodSelectTemplate(string period) returns sql:ParameterizedQuery {
    if period == "daily" {
        return `SELECT to_char(expense_date, 'YYYY-MM-DD') AS "period", logged_by_user_id AS "userId",
            logged_by_name AS "displayName", SUM(amount_usd) AS "totalUsd" FROM expenses WHERE 1=1`;
    }
    if period == "weekly" {
        return `SELECT to_char(expense_date, 'IYYY-"W"IW') AS "period", logged_by_user_id AS "userId",
            logged_by_name AS "displayName", SUM(amount_usd) AS "totalUsd" FROM expenses WHERE 1=1`;
    }
    return `SELECT to_char(expense_date, 'YYYY-MM') AS "period", logged_by_user_id AS "userId",
        logged_by_name AS "displayName", SUM(amount_usd) AS "totalUsd" FROM expenses WHERE 1=1`;
}

function fetchPeriodUserTotals(string period, string? fromDate, string? toDate) returns UserPeriodRow[]|error {
    sql:ParameterizedQuery query = periodSelectTemplate(period);
    if fromDate is string {
        query = sql:queryConcat(query, ` AND expense_date >= ${fromDate}::date`);
    }
    if toDate is string {
        query = sql:queryConcat(query, ` AND expense_date <= ${toDate}::date`);
    }
    query = sql:queryConcat(query, ` GROUP BY period, logged_by_user_id, logged_by_name ORDER BY period ASC`);
    stream<UserPeriodRow, sql:Error?> resultStream = dbClient->query(query);
    UserPeriodRow[] rows = [];
    check from UserPeriodRow row in resultStream
        do {
            rows.push(row);
        };
    return rows;
}

function periodJoinFilter(string period) returns sql:ParameterizedQuery {
    if period == "daily" {
        return ` AND e.expense_date = CURRENT_DATE`;
    }
    if period == "weekly" {
        return ` AND date_trunc('week', e.expense_date) = date_trunc('week', CURRENT_DATE)`;
    }
    return ` AND date_trunc('month', e.expense_date) = date_trunc('month', CURRENT_DATE)`;
}

function fetchCategoryTotalRows(string period) returns CategoryTotalRow[]|error {
    sql:ParameterizedQuery baseQuery = `SELECT c.id AS "categoryId", c.name AS "categoryName",
        c.limit_usd AS "limitUsd", COALESCE(SUM(e.amount_usd), 0) AS "totalUsd"
        FROM categories c LEFT JOIN expenses e ON e.category_id = c.id`;
    sql:ParameterizedQuery withFilter = sql:queryConcat(baseQuery, periodJoinFilter(period));
    sql:ParameterizedQuery finalQuery = sql:queryConcat(withFilter, ` GROUP BY c.id, c.name, c.limit_usd ORDER BY c.name ASC`);
    stream<CategoryTotalRow, sql:Error?> resultStream = dbClient->query(finalQuery);
    CategoryTotalRow[] rows = [];
    check from CategoryTotalRow row in resultStream
        do {
            rows.push(row);
        };
    return rows;
}
