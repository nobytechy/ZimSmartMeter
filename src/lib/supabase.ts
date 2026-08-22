import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * The single shared Supabase client. The anon key is safe in the browser
 * only because Row Level Security does the real enforcement server-side.
 * Sessions persist locally and refresh automatically.
 */
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
);
