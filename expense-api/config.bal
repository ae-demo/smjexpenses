import ballerina/os;

// Postgres (expense-db) — platform-injected at deploy time, empty at build/dev
// time. Local fallbacks are applied where these are consumed (db.bal) so the
// service still starts with no env vars set.
configurable string dbHost = os:getEnv("EXPENSE_DB_HOST");
configurable string dbPort = os:getEnv("EXPENSE_DB_PORT");
configurable string dbName = os:getEnv("EXPENSE_DB_DBNAME");
configurable string dbUser = os:getEnv("EXPENSE_DB_USER");
configurable string dbPassword = os:getEnv("EXPENSE_DB_PASSWORD");

// Frankfurter FX rate API — keyless, defaults to the public host.
configurable string frankfurterBaseUrl = os:getEnv("FRANKFURTER_BASE_URL");

// Note: user-auth (Thunder) is validated by the platform's API gateway, which
// injects the caller's verified identity as X-User-Id / X-User-Name headers —
// this service never validates a token itself, so no user-auth env vars are
// read here (see the api-management / thunder-authentication skills).
