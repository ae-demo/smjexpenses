// Data shapes shared across the service. Field names match the OpenAPI
// schemas (specs/design/components/expense-api/openapi.yaml) and, via SQL
// column aliases, the database rows read into them (db.bal / queries.bal).

public type ApiError record {|
    int code;
    string message;
    string description?;
    string moreInfo?;
|};

public type Category record {|
    string id;
    string name;
    decimal? limitUsd;
|};

public type CategoryInput record {|
    string name;
    decimal? limitUsd?;
|};

public type CategoryUpdateInput record {|
    string name?;
    decimal? limitUsd?;
|};

public type Expense record {|
    string id;
    string categoryId;
    decimal amount;
    string currency;
    decimal amountUsd;
    string expenseDate;
    string loggedTimezone;
    string loggedByUserId;
    string loggedByName;
    string createdAt;
|};

public type ExpenseInput record {|
    string categoryId;
    decimal amount;
    string currency;
    string expenseDate;
    string loggedTimezone;
|};

public type ExpenseListResponse record {|
    int count;
    string? next;
    string? previous;
    Expense[] data;
|};

public type CategoryListResponse record {|
    int count;
    string? next;
    string? previous;
    Category[] data;
|};

public type UserTotal record {|
    string userId;
    string displayName;
    decimal totalUsd;
|};

public type PeriodTotal record {|
    string period;
    decimal totalUsd;
    UserTotal[] byUser;
|};

public type CategoryTotal record {|
    string categoryId;
    string categoryName;
    decimal totalUsd;
    decimal? limitUsd;
    string status;
|};

// Internal row shapes read straight off SQL queries (queries.bal).

type UserPeriodRow record {|
    string period;
    string userId;
    string displayName;
    decimal totalUsd;
|};

type CategoryTotalRow record {|
    string categoryId;
    string categoryName;
    decimal? limitUsd;
    decimal totalUsd;
|};
