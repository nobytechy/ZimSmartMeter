/**
 * kWh for a dollar amount at a tariff rate, rounded to one decimal —
 * intentionally mirroring Postgres round(x, 1) so the preview the user
 * sees equals the credit the database computes. If these ever disagree,
 * the database wins; this exists only for display.
 */
export function computeKwh(amountUsd: number, rateKwhPerUsd: number): number {
  return Math.round(amountUsd * rateKwhPerUsd * 10) / 10;
}
