import ballerina/http;

listener http:Listener httpListener = new (9090);

service / on httpListener {

    // ---- /expenses ---------------------------------------------------

    resource function get expenses(@http:Header string? x\-user\-id, int 'limit = 20, int offset = 0,
            string? categoryId = (), string? 'from = (), string? to = ())
            returns ExpenseListResponse|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        int boundedLimit = 'limit > 100 ? 100 : 'limit;
        Expense[] rows = check listExpenseRows(boundedLimit, offset, categoryId, 'from, to);
        int total = check countExpenseRows(categoryId, 'from, to);
        string? next = buildNextUri("/expenses", boundedLimit, offset, total);
        string? previous = buildPreviousUri("/expenses", boundedLimit, offset);
        return {count: total, next: next, previous: previous, data: rows};
    }

    resource function post expenses(@http:Header string? x\-user\-id, @http:Header string? x\-user\-name,
            ExpenseInput payload) returns http:Created|http:BadRequest|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        string loggedByUserId = userId;
        string loggedByName = resolveUserName(x\-user\-name, loggedByUserId);

        if payload.amount <= 0d {
            return <http:BadRequest>{body: {code: 400, message: "amount must be positive"}};
        }
        if payload.currency.trim().length() == 0 {
            return <http:BadRequest>{body: {code: 400, message: "currency is required"}};
        }
        boolean catExists = check categoryExists(payload.categoryId);
        if !catExists {
            return <http:BadRequest>{body: {code: 400, message: "unknown categoryId"}};
        }

        decimal|error amountUsd = computeAmountUsd(payload.amount, payload.currency, payload.expenseDate);
        if amountUsd is error {
            return <http:BadRequest>{
                body: {code: 400, message: "could not convert currency to USD", description: amountUsd.message()}
            };
        }

        string id = newId();
        check insertExpense(id, payload.categoryId, payload.amount, payload.currency, amountUsd,
            payload.expenseDate, payload.loggedTimezone, loggedByUserId, loggedByName);

        Expense? created = check findExpenseById(id);
        if created is Expense {
            return <http:Created>{body: created};
        }
        return error("expense not found immediately after insert");
    }

    // ---- /expenses/{expenseId} ----------------------------------------

    resource function put expenses/[string expenseId](@http:Header string? x\-user\-id, ExpenseInput payload)
            returns http:Ok|http:BadRequest|http:NotFound|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }

        // Shared pool: any household member may edit any expense — no
        // ownership check against loggedByUserId here (per PRD).
        Expense? existing = check findExpenseById(expenseId);
        if existing is () {
            return <http:NotFound>{body: {code: 404, message: "expense not found"}};
        }

        if payload.amount <= 0d {
            return <http:BadRequest>{body: {code: 400, message: "amount must be positive"}};
        }
        if payload.currency.trim().length() == 0 {
            return <http:BadRequest>{body: {code: 400, message: "currency is required"}};
        }
        boolean catExists = check categoryExists(payload.categoryId);
        if !catExists {
            return <http:BadRequest>{body: {code: 400, message: "unknown categoryId"}};
        }

        decimal|error amountUsd = computeAmountUsd(payload.amount, payload.currency, payload.expenseDate);
        if amountUsd is error {
            return <http:BadRequest>{
                body: {code: 400, message: "could not convert currency to USD", description: amountUsd.message()}
            };
        }

        check updateExpenseRow(expenseId, payload.categoryId, payload.amount, payload.currency, amountUsd,
            payload.expenseDate, payload.loggedTimezone);

        Expense? updated = check findExpenseById(expenseId);
        if updated is Expense {
            return <http:Ok>{body: updated};
        }
        return error("expense not found immediately after update");
    }

    resource function delete expenses/[string expenseId](@http:Header string? x\-user\-id)
            returns http:NoContent|http:NotFound|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        // Shared pool: any household member may delete any expense.
        int affected = check deleteExpenseRow(expenseId);
        if affected == 0 {
            return <http:NotFound>{body: {code: 404, message: "expense not found"}};
        }
        return http:NO_CONTENT;
    }

    // ---- /categories ----------------------------------------------------

    resource function get categories(@http:Header string? x\-user\-id, int 'limit = 20, int offset = 0)
            returns CategoryListResponse|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        int boundedLimit = 'limit > 100 ? 100 : 'limit;
        Category[] rows = check listCategoryRows(boundedLimit, offset);
        int total = check countCategories();
        string? next = buildNextUri("/categories", boundedLimit, offset, total);
        string? previous = buildPreviousUri("/categories", boundedLimit, offset);
        return {count: total, next: next, previous: previous, data: rows};
    }

    resource function post categories(@http:Header string? x\-user\-id, CategoryInput payload)
            returns http:Created|http:BadRequest|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        if payload.name.trim().length() == 0 {
            return <http:BadRequest>{body: {code: 400, message: "name is required"}};
        }
        string id = newId();
        decimal? limitUsd = payload?.limitUsd;
        check insertCategory(id, payload.name, limitUsd);
        Category created = {id: id, name: payload.name, limitUsd: limitUsd};
        return <http:Created>{body: created};
    }

    // ---- /categories/{categoryId} ---------------------------------------

    resource function put categories/[string categoryId](@http:Header string? x\-user\-id, CategoryUpdateInput payload)
            returns http:Ok|http:NotFound|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        Category? existing = check findCategoryById(categoryId);
        if existing is () {
            return <http:NotFound>{body: {code: 404, message: "category not found"}};
        }
        Category current = existing;

        string? newNameOpt = payload?.name;
        string newName = newNameOpt is string && newNameOpt.trim().length() > 0 ? newNameOpt : current.name;
        decimal? payloadLimit = payload?.limitUsd;
        decimal? newLimit = payloadLimit is decimal ? payloadLimit : current.limitUsd;

        check updateCategoryRow(categoryId, newName, newLimit);
        Category updated = {id: categoryId, name: newName, limitUsd: newLimit};
        return <http:Ok>{body: updated};
    }

    resource function delete categories/[string categoryId](@http:Header string? x\-user\-id)
            returns http:NoContent|http:NotFound|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        int affected = check deleteCategoryRow(categoryId);
        if affected == 0 {
            return <http:NotFound>{body: {code: 404, message: "category not found"}};
        }
        return http:NO_CONTENT;
    }

    // ---- /categories/totals -----------------------------------------------

    resource function get categories/totals(@http:Header string? x\-user\-id, string period)
            returns CategoryTotal[]|http:BadRequest|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        if !isValidPeriod(period) {
            return <http:BadRequest>{body: {code: 400, message: "invalid period"}};
        }
        CategoryTotalRow[] rows = check fetchCategoryTotalRows(period);
        CategoryTotal[] result = [];
        foreach CategoryTotalRow row in rows {
            string status = computeLimitStatus(row.totalUsd, row.limitUsd);
            result.push({
                categoryId: row.categoryId,
                categoryName: row.categoryName,
                totalUsd: row.totalUsd,
                limitUsd: row.limitUsd,
                status: status
            });
        }
        return result;
    }

    // ---- /totals ----------------------------------------------------------

    resource function get totals(@http:Header string? x\-user\-id, string period, string? 'from = (), string? to = ())
            returns PeriodTotal[]|http:BadRequest|http:Unauthorized|error {
        string|http:Unauthorized userId = resolveUserId(x\-user\-id);
        if userId is http:Unauthorized {
            return userId;
        }
        if !isValidPeriod(period) {
            return <http:BadRequest>{body: {code: 400, message: "invalid period"}};
        }
        UserPeriodRow[] rows = check fetchPeriodUserTotals(period, 'from, to);
        return aggregatePeriodTotals(rows);
    }
}
