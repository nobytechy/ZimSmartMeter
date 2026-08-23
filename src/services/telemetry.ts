import { supabase } from "../lib/supabase";
import type { DayUsage } from "../features/consumption/simulated";

export async function recordReading(
  meterId: string,
  voltage: number,
  currentA: number,
  powerW: number,
  energyKwh: number,
): Promise<{ ok: boolean; balance_kwh?: number; reason?: string }> {
  const { data, error } = await supabase.rpc("record_reading", {
    p_meter_id: meterId,
    p_voltage: voltage,
    p_current_a: currentA,
    p_power_w: powerW,
    p_energy_kwh: energyKwh,
  });
  if (error) return { ok: false, reason: error.message };
  return data as { ok: boolean; balance_kwh?: number; reason?: string };
}

export async function setMeterPresence(
  meterId: string,
  online: boolean,
): Promise<void> {
  await supabase.rpc("set_meter_presence", {
    p_meter_id: meterId,
    p_online: online,
  });
}

const dayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
});

/** Real daily consumption from meter_readings; empty until telemetry runs. */
export async function getDailyConsumption(
  meterId: string,
): Promise<DayUsage[]> {
  const { data, error } = await supabase.rpc("get_daily_consumption", {
    p_meter_id: meterId,
  });
  if (error || !data) return [];
  return (data as { day: string; kwh: number }[]).map((r) => ({
    day: dayLabel.format(new Date(r.day)),
    kwh: Number(r.kwh),
  }));
}
