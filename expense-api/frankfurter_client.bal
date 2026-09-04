import ballerina/http;

// Safe local default per specs/design/components/expense-api/design.json.
final string resolvedFrankfurterUrl = frankfurterBaseUrl != "" ? frankfurterBaseUrl : "https://api.frankfurter.dev/v1";
final string frankfurterBase = resolvedFrankfurterUrl.endsWith("/")
    ? resolvedFrankfurterUrl.substring(0, resolvedFrankfurterUrl.length() - 1)
    : resolvedFrankfurterUrl;

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
