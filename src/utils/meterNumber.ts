/**
 * Meter numbers are 11 digits ending in a Luhn check digit — the same
 * checksum bank cards use. The client checks the FORMAT instantly so
 * typos die on the phone; the SERVER remains the only authority on
 * whether a meter exists, is active, and is unclaimed.
 */
export function normalizeMeterNumber(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

export function isValidMeterNumber(n: string): boolean {
  if (!/^\d{11}$/.test(n)) return false;
  let sum = 0;
  let dbl = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = n.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** 04954653178 → "0495 4653 178" for display. */
export function formatMeterNumber(n: string): string {
  return n.replace(/^(\d{4})(\d{4})(\d{3})$/, "$1 $2 $3");
}
