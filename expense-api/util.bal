import ballerina/http;
import ballerina/uuid;

function newId() returns string {
    return uuid:createRandomUuid();
}

// amountUsd is computed once, at write time only (create or update) — never
// re-derived on read and never recomputed from current rates later.
function computeAmountUsd(decimal amount, string currency, string expenseDate) returns decimal|error {
    if currency == "USD" {
        return amount;
    }
    decimal rate = check fetchHistoricalUsdRate(expenseDate, currency);
    return amount * rate;
}

// near = >=90% of limit, over = >100%; ok otherwise or when no limit is set.
function computeLimitStatus(decimal totalUsd, decimal? limitUsd) returns string {
    if limitUsd is () {
        return "ok";
    }
    decimal actualLimit = limitUsd;
    if actualLimit <= 0d {
        return "ok";
    }
    decimal ratio = totalUsd / actualLimit;
    if ratio > 1.0d {
        return "over";
    }
    if ratio >= 0.9d {
        return "near";
    }
    return "ok";
}

// X-User-Id is declared OPTIONAL on the resource so a missing header resolves
// here to 401, rather than a framework-level 400 (api-management skill).
function resolveUserId(string? headerValue) returns string|http:Unauthorized {
    if headerValue is string && headerValue.trim().length() > 0 {
        return headerValue;
    }
    return <http:Unauthorized>{
        body: {code: 401, message: "missing caller identity", description: "X-User-Id header is required"}
    };
}

// X-User-Name may be absent even for a valid caller — fall back to the id.
function resolveUserName(string? headerValue, string userId) returns string {
    if headerValue is string && headerValue.trim().length() > 0 {
        return headerValue;
    }
    return userId;
}

function isValidPeriod(string period) returns boolean {
    return period == "daily" || period == "weekly" || period == "monthly";
}

function buildNextUri(string basePath, int 'limit, int offset, int count) returns string? {
    int nextOffset = offset + 'limit;
    if nextOffset < count {
        return basePath + "?limit=" + 'limit.toString() + "&offset=" + nextOffset.toString();
    }
    return ();
}

function buildPreviousUri(string basePath, int 'limit, int offset) returns string? {
    if offset <= 0 {
        return ();
    }
    int prevOffset = offset - 'limit;
    if prevOffset < 0 {
        prevOffset = 0;
    }
    return basePath + "?limit=" + 'limit.toString() + "&offset=" + prevOffset.toString();
}

// Rows arrive grouped and ordered by period (queries.bal) — fold same-period
// rows into one PeriodTotal, preserving that chronological order.
function aggregatePeriodTotals(UserPeriodRow[] rows) returns PeriodTotal[] {
    map<PeriodTotal> byPeriod = {};
    string[] periodOrder = [];
    foreach UserPeriodRow row in rows {
        UserTotal userTotal = {userId: row.userId, displayName: row.displayName, totalUsd: row.totalUsd};
        PeriodTotal? existing = byPeriod[row.period];
        if existing is () {
            byPeriod[row.period] = {period: row.period, totalUsd: row.totalUsd, byUser: [userTotal]};
            periodOrder.push(row.period);
        } else {
            existing.byUser.push(userTotal);
            existing.totalUsd = existing.totalUsd + row.totalUsd;
        }
    }
    PeriodTotal[] result = [];
    foreach string period in periodOrder {
        PeriodTotal? periodTotal = byPeriod[period];
        if periodTotal is PeriodTotal {
            result.push(periodTotal);
        }
    }
    return result;
}
