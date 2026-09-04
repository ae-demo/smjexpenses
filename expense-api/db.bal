import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// Safe local defaults so the service starts with no env vars set — real
// values arrive at deploy time via the expense-db platform-resource wiring.
final string resolvedDbHost = dbHost != "" ? dbHost : "localhost";
final int resolvedDbPort = resolveDbPort(dbPort);
final string resolvedDbName = dbName != "" ? dbName : "expense";
final string resolvedDbUser = dbUser != "" ? dbUser : "expense";
final string resolvedDbPassword = dbPassword != "" ? dbPassword : "expense";

final postgresql:Client dbClient = check new (
    host = resolvedDbHost,
    port = resolvedDbPort,
    username = resolvedDbUser,
    password = resolvedDbPassword,
    database = resolvedDbName
);

function resolveDbPort(string portValue) returns int {
    if portValue == "" {
        return 5432;
    }
    int|error parsed = int:fromString(portValue);
    if parsed is int {
        return parsed;
    }
    return 5432;
}

// Runs before any listener starts, so a schema failure fails the service fast.
final () dbInitResult = check initDb();

function initDb() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            limit_usd NUMERIC,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS expenses (
            id VARCHAR(64) PRIMARY KEY,
            category_id VARCHAR(64) NOT NULL,
            amount NUMERIC NOT NULL,
            currency VARCHAR(8) NOT NULL,
            amount_usd NUMERIC NOT NULL,
            expense_date DATE NOT NULL,
            logged_timezone VARCHAR(64) NOT NULL,
            logged_by_user_id VARCHAR(128) NOT NULL,
            logged_by_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
}
