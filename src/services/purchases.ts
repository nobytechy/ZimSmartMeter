import { supabase } from "../lib/supabase";

export type PurchaseSuccess = {
  ok: true;
  duplicate: boolean;
  pending: false;
  method: string;
  payment_ref: string;
  amount_usd: number;
  kwh: number;
  new_balance: number;
  meter_id: string;
};

export type PurchasePending = {
  ok: true;
  duplicate: boolean;
  pending: true;
  method: string;
  payment_id: string;
  payment_ref: string;
  amount_usd: number;
};

export type PurchaseResult =
  | PurchaseSuccess
  | PurchasePending
  | { ok: false; reason: string };

export type PaymentMethod = "instant" | "cash" | "paynow" | "manishapay";

/**
 * One idempotency key per purchase INTENT, reused on every retry of it.
 * Instant completes atomically; cash returns a pending reference that
 * confirmCashPayment() later completes. Same key ⇒ same answer, always.
 */
export async function purchaseElectricity(
  meterId: string,
  amountUsd: number,
  idempotencyKey: string,
  method: PaymentMethod,
): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc("purchase_electricity", {
    p_meter_id: meterId,
    p_amount_usd: amountUsd,
    p_idempotency_key: idempotencyKey,
    p_method: method,
  });
  if (error) return { ok: false, reason: error.message };
  return data as PurchaseResult;
}

export async function confirmCashPayment(
  paymentId: string,
): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc("confirm_cash_payment", {
    p_payment_id: paymentId,
  });
  if (error) return { ok: false, reason: error.message };
  return data as PurchaseResult;
}

export type GatewayInitiate =
  | { ok: true; browser_url: string | null; instructions: string | null; status: string }
  | { error: string };

export type GatewayStatus =
  | { settled: true; outcome: string; receipt: PurchaseResult }
  | { settled: false; outcome: string }
  | { error: string };

export async function initiateManishaPay(
  paymentRef: string,
): Promise<GatewayInitiate> {
  const { data, error } = await supabase.functions.invoke("manishapay", {
    body: { action: "initiate", payment_ref: paymentRef },
  });
  if (error) return { error: error.message };
  return data as GatewayInitiate;
}

export async function checkManishaPay(
  paymentRef: string,
): Promise<GatewayStatus> {
  const { data, error } = await supabase.functions.invoke("manishapay", {
    body: { action: "status", payment_ref: paymentRef },
  });
  if (error) return { error: error.message };
  return data as GatewayStatus;
}
