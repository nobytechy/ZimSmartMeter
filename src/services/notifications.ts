import { supabase } from "../lib/supabase";

export type AppNotification = {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
};

export async function listUnread(): Promise<AppNotification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, created_at")
    .eq("read", false)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data as AppNotification[]) ?? [];
}

/** `read` is the one notification column clients may write — by design. */
export async function markRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}
