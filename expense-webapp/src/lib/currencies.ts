// A short curated list of ISO 4217 codes for the currency select. expense-api
// accepts any code; this list only saves typing for the common cases. The
// SPA never converts between currencies — expense-api returns amountUsd
// already converted.
export const CURATED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "LKR",
  "INR",
  "AUD",
  "CAD",
  "JPY",
  "SGD",
  "AED",
] as const;
