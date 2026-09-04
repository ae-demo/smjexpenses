import ballerina/http;

// Safe local default per specs/design/components/expense-api/design.json.
// The injected FRANKFURTER_BASE_URL may be provisioned as either the bare
// host (https://api.frankfurter.dev) or the versioned root our own contract
// documents (https://api.frankfurter.dev/v1) — every historical-rate lookup
// 404s ("could not convert currency to USD") when a bare host is supplied and
// no code path re-adds the version segment, so it is normalized once here
// regardless of which shape arrives.
final string frankfurterBase = normalizeFrankfurterBase(frankfurterBaseUrl);

function normalizeFrankfurterBase(string configuredUrl) returns string {
    string base = configuredUrl != "" ? configuredUrl : "https://api.frankfurter.dev/v1";
    if base.endsWith("/") {
        base = base.substring(0, base.length() - 1);
    }
    if !base.endsWith("/v1") {
        base = base + "/v1";
    }
    return base;
}

final http:Client frankfurterClient = check new (frankfurterBase);

type FrankfurterRateResponse record {|
    decimal amount;
    string base;
    string date;
    map<decimal> rates;
|};

// Historical rate for baseCurrency -> USD on expenseDate, per
// specs/design/components/expense-api/dependencies/frankfurter.openapi.yaml.
function fetchHistoricalUsdRate(string expenseDate, string baseCurrency) returns decimal|error {
    string path = "/" + expenseDate + "?base=" + baseCurrency + "&symbols=USD";
    FrankfurterRateResponse response = check frankfurterClient->get(path);
    decimal? rate = response.rates["USD"];
    if rate is decimal {
        return rate;
    }
    return error("Frankfurter returned no USD rate for " + baseCurrency + " on " + expenseDate);
}
