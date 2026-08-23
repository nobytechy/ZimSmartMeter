import { supabase } from "../lib/supabase";
import { purchaseElectricity } from "./purchases";
import type { PurchaseResult } from "./purchases";

export type AgentEvent = {
  id: string;
  meter_id: string | null;
  kind: "low_balance_proposal" | "high_usage_alert" | "auto_topup_executed" | "info";
  title: string;
  body: string | null;
  data: { suggested_usd?: number } | null;
  status: string;
  created_at: string;
};

export type AgentSettings = {
  enabled: boolean;
  low_threshold_kwh: number;
  auto_topup: boolean;
  auto_topup_usd: number | null;
};

export async function listOpenEvents(): Promise<AgentEvent[]> {
  const { data } = await supabase
    .from("agent_events")
    .select("id, meter_id, kind, title, body, data, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(10);
  return (data as AgentEvent[]) ?? [];
}

export async function getSettings(): Promise<AgentSettings | null> {
  const { data } = await supabase
    .from("agent_settings")
    .select("enabled, low_threshold_kwh, auto_topup, auto_topup_usd")
    .maybeSingle();
  return (data as AgentSettings) ?? null;
}

export async function saveSettings(patch: Partial<AgentSettings>): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase
    .from("agent_settings")
    .upsert({ user_id: userData.user.id, ...patch });
}

export async function setEventStatus(id: string, status: "dismissed" | "done") {
  await supabase.from("agent_events").update({ status }).eq("id", id);
}

export async function runNoby(): Promise<void> {
  await supabase.rpc("agent_tick_self");
}

/** Human approval: the tap that turns a proposal into an atomic purchase. */
export async function approveProposal(ev: AgentEvent): Promise<PurchaseResult> {
  const amount = ev.data?.suggested_usd;
  if (!ev.meter_id || !amount) return { ok: false, reason: "bad_proposal" };
  const result = await purchaseElectricity(
    ev.meter_id,
    amount,
    crypto.randomUUID(),
    "instant",
  );
  if (result.ok && !result.pending) await setEventStatus(ev.id, "done");
  return result;
}
