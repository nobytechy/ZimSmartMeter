import { useCallback, useEffect, useRef, useState } from "react";
import { fieldDark, glass } from "../components/ui";
import { useT } from "../i18n/context";
import {
  askAssistant,
  deleteConversation,
  listConversations,
  loadMessages,
} from "../services/chat";
import type { ChatMessage, Conversation } from "../services/chat";

const suggestions = [
  "Anything needing my attention?",
  "How long will my balance last?",
  "If I buy $20, how long will that last?",
  "Set my low-balance threshold to 15 kWh",
] as const;

/**
 * Noby's chat. Threads persist in Postgres, so history survives a closed
 * browser and a new device. The thread list is a panel on mobile and a
 * second column from `md` up.
 */
export default function Assistant() {
  const t = useT();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThreads, setShowThreads] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const refreshList = useCallback(async () => {
    setConversations(await listConversations());
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function openThread(id: string) {
    setActiveId(id);
    setShowThreads(false);
    setError(null);
    setMessages(await loadMessages(id));
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setShowThreads(false);
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    const res = await askAssistant(next.slice(-16), activeId);
    setBusy(false);
    if (res.error || !res.reply) {
      setError(res.error ?? "Noby went quiet — try again.");
      return;
    }
    setMessages([...next, { role: "assistant", content: res.reply }]);
    if (res.conversation_id && res.conversation_id !== activeId) {
      setActiveId(res.conversation_id);
    }
    void refreshList();
  }

  const threadList = (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={newChat}
        className="mb-1 rounded-lg bg-volt px-3 py-2.5 text-sm font-semibold text-ink active:brightness-95"
      >
        + New chat
      </button>
      {conversations.length === 0 && (
        <p className="px-1 py-2 text-xs text-mist">No past chats yet.</p>
      )}
      {conversations.map((c) => (
        <div
          key={c.id}
          className={`group flex items-center gap-1 rounded-lg ${
            c.id === activeId ? "bg-white/10" : "hover:bg-white/5"
          }`}
        >
          <button
            type="button"
            onClick={() => void openThread(c.id)}
            className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm text-paper"
          >
            {c.title}
          </button>
          <button
            type="button"
            aria-label={`Delete ${c.title}`}
            onClick={() => {
              void deleteConversation(c.id).then(() => {
                if (c.id === activeId) newChat();
                void refreshList();
              });
            }}
            className="px-2 py-2 text-xs text-mist hover:text-flare"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 pt-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("chat.title")}
          </h1>
          <p className="mt-0.5 text-sm text-mist">
            {t("chat.sub")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowThreads((v) => !v)}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-mist md:hidden"
        >
          {showThreads ? "Hide chats" : "Chats"}
        </button>
      </div>

      {showThreads && (
        <div className={`${glass} p-3 md:hidden`}>{threadList}</div>
      )}

      <div className="grid gap-4 md:grid-cols-[15rem_1fr]">
        <aside className={`${glass} hidden h-fit p-3 md:block`}>
          {threadList}
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          <div className={`${glass} flex min-h-[46vh] flex-col gap-3 p-4`}>
            {messages.length === 0 && !busy && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
                <p className="text-sm text-mist">Ask about your electricity:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-paper hover:bg-white/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-volt/15 px-4 py-2.5 text-[15px] text-paper"
                    : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap"
                }
              >
                {m.content}
              </div>
            ))}

            {busy && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5">
                <span aria-hidden className="h-2 w-2 rounded-full bg-volt motion-safe:animate-pulse" />
                <span className="font-mono text-xs text-mist">
                  {t("chat.thinking")}
                </span>
              </div>
            )}

            {error && <p className="text-sm text-flare">{error}</p>}
            <div ref={endRef} />
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Noby…"
              aria-label="Ask Noby"
              className={`${fieldDark} min-w-0 flex-1 text-[15px]`}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-volt px-5 text-[15px] font-semibold text-ink active:brightness-95 disabled:opacity-60"
            >
              {t("chat.ask")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
