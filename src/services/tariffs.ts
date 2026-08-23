import { supabase } from "../lib/supabase";

export type Tariff = { id: string; name: string; rate_kwh_per_usd: number };

/** RLS exposes only the active tariff — exactly what pricing UIs need. */
export async function getActiveTariff(): Promise<{
  data: Tariff | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("tariffs")
    .select("id, name, rate_kwh_per_usd")
    .eq("active", true)
    .maybeSingle();
  return { data: (data as Tariff) ?? null, error: error?.message ?? null };
}
