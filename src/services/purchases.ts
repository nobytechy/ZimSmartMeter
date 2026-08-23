import { supabase } from "../lib/supabase";

export type PurchaseResult =
  | {
      ok: true;
      duplicate: boolean;
      payment_ref: string;
      amount_usd: number;
      kwh: number;
      new_balance: number;
      meter_id: string;
    }
  | { ok: false; reason: string };

/**
 * One idempotency key per purchase INTENT: the caller mints it when the
 * user reaches the confirm screen and reuses it for every retry of that
 * confirmation. The server guarantees: same key, same answer, one credit.
 */
export async function purchaseElectricity(
  meterId: string,
  amountUsd: number,
  idempotencyKey: string,
): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc("purchase_electricity", {
    p_meter_id: meterId,
    p_amount_usd: amountUsd,
    p_idempotency_key: idempotencyKey,
  });
  if (error) return { ok: false, reason: error.message };
  return data as PurchaseResult;
}
