import { supabase } from "../lib/supabase";
import type { Meter } from "../types/meter";

/** Reads are plain selects — RLS scopes them to the signed-in user. */
export async function listMeters(): Promise<{
  data: Meter[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("meters")
    .select(
      "id, meter_number, nickname, balance_kwh, status, last_seen_at, created_at",
    )
    .order("created_at", { ascending: true });
  return { data: (data as Meter[]) ?? [], error: error?.message ?? null };
}

export type ClaimResult =
  | {
      ok: true;
      meter: Pick<Meter, "id" | "meter_number" | "balance_kwh" | "status">;
    }
  | { ok: false; reason: string };

/** Writes go through the claim functions — the only door meters have. */
export async function claimMeter(meterNumber: string): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc("claim_meter", {
    p_meter_number: meterNumber,
  });
  if (error) return { ok: false, reason: error.message };
  return data as ClaimResult;
}

export async function claimDemoMeter(): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc("claim_random_demo_meter");
  if (error) return { ok: false, reason: error.message };
  return data as ClaimResult;
}
