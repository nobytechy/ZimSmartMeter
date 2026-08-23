import { supabase } from "../lib/supabase";

/**
 * The auth service — the only file that talks to supabase.auth.
 * Identical calls whether OTPs are dashboard test codes, Twilio SMS,
 * or a local gateway behind a Send-SMS hook. That is the swap boundary.
 */
export async function requestOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return { error: error?.message ?? null };
}

export async function verifyOtp(phone: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  return { error: error?.message ?? null };
}

export async function signOut() {
  await supabase.auth.signOut();
}
