import { supabase } from "../lib/supabase";
import { functionError } from "./purchases";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Conversation = { id: string; title: string; updated_at: string };

export async function askAssistant(
  messages: ChatMessage[],
  conversationId: string | null,
): Promise<{ reply?: string; conversation_id?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke("assistant", {
    body: { messages, conversation_id: conversationId },
  });
  if (error) return { error: await functionError(error) };
  return data as { reply?: string; conversation_id?: string };
}

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await supabase
    .from("chat_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(30);
  return (data as Conversation[]) ?? [];
}

export async function loadMessages(id: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  return (data as ChatMessage[]) ?? [];
}

export async function deleteConversation(id: string): Promise<void> {
  await supabase.from("chat_conversations").delete().eq("id", id);
}
