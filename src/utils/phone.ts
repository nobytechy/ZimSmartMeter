/**
 * Zimbabwean mobile numbers arrive in three habits:
 *   0772 123 456 · 263 772 123 456 · +263 772 123 456
 * Normalize every habit to E.164 (+2637XXXXXXXX), or return null when the
 * input can never be a Zimbabwean mobile. Pure function — no I/O — so it
 * is trivially unit-testable.
 */
export function normalizeZimPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let rest: string;
  if (digits.startsWith("+263")) rest = digits.slice(4);
  else if (digits.startsWith("263")) rest = digits.slice(3);
  else if (digits.startsWith("0")) rest = digits.slice(1);
  else return null;
  if (!/^7\d{8}$/.test(rest)) return null;
  return "+263" + rest;
}

/** +263771234567 → "+263 77 123 4567" for display. */
export function formatZimPhone(e164: string): string {
  const m = e164.match(/^\+263(7\d)(\d{3})(\d{4})$/);
  return m ? `+263 ${m[1]} ${m[2]} ${m[3]}` : e164;
}
