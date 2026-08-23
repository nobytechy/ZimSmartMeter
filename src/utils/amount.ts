/** $5.00–$1,000.00, at most two decimals — the same rule the DB enforces. */
export const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

export function isValidAmount(input: string): boolean {
  if (!AMOUNT_RE.test(input)) return false;
  const n = Number(input);
  return n >= 5 && n <= 1000;
}
