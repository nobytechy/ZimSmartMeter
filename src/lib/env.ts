import { z } from "zod";

/**
 * Environment is validated once, at first import. A missing or malformed
 * value fails loudly here — not as a cryptic network error three screens
 * deep. Only VITE_-prefixed vars exist in the browser bundle; real secrets
 * (service-role keys, AI keys) must never carry this prefix.
 */
const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.jwt(),
});

export const env = EnvSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
