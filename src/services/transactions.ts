import { supabase } from "../lib/supabase";

export type Txn = {
  id: string;
  type: "purchase" | "credit" | "adjustment";
  amount_usd: number | null;
  kwh: number | null;
  ref: string | null;
  meter_id: string | null;
  created_at: string;
};

/** The ledger, newest first. RLS scopes rows to the signed-in user. */
export async function listTransactions(limit = 20): Promise<{
  data: Txn[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount_usd, kwh, ref, meter_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: (data as Txn[]) ?? [], error: error?.message ?? null };
}
