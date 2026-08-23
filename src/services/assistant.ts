import { supabase } from "../lib/supabase";
import { functionError } from "./purchases";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** One round-trip to the tool-restricted assistant. History travels with it. */
export async function askAssistant(
  messages: ChatMessage[],
): Promise<{ reply?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke("assistant", {
    body: { messages },
  });
  if (error) return { error: await functionError(error) };
  return data as { reply?: string; error?: string };
}
