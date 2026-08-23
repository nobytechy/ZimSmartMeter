const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "22 Aug, 14:05" — compact, unambiguous, locale-stable. */
export function shortDateTime(iso: string): string {
  return fmt.format(new Date(iso));
}
