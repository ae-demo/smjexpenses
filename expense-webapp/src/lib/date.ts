// Device-local date/timezone helpers. The SPA does zero currency math and no
// date math beyond "what is today, here, right now" — expense-api owns
// everything else.
import type { ISODateString } from "@astryxdesign/core/utils";

export type { ISODateString };

/** Today's date as YYYY-MM-DD in the device's local timezone. */
export function todayLocalISODate(): ISODateString {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as ISODateString;
}

/** IANA timezone active on this device right now. */
export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
