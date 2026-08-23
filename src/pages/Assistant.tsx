import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { fieldDark, glass } from "../components/ui";
import { askAssistant } from "../services/assistant";
import type { ChatMessage } from "../services/assistant";

const suggestions = [
  "How long will my balance last?",
  "Compare this week to last week",
  "What were my last purchases?",
  "Is my meter online?",
] as const;

/**
 * Chat with the Energy Assistant. Answers come only from the user's own
 * data through server-side tools — the model never touches the database.
 */
export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    const res = await askAssistant(next);
    setBusy(false);
    if (res.error || !res.reply) {
      setError(res.error ?? "The assistant went quiet — try again.");
      return;
    }
    setMessages([...next, { role: "assistant", content: res.reply }]);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pt-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Energy Assistant
          </h1>
          <p className="mt-0.5 text-sm text-mist">
            Answers come only from your meter's data. Estimates are labelled.
          </p>
        </div>
        <Link to="/app" className="text-sm text-mist underline underline-offset-4">
          Dashboard
        </Link>
      </div>

      <div className={`${glass} flex min-h-[50vh] flex-col gap-3 p-4`}>
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
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-volt motion-safe:animate-pulse"
            />
            <span className="font-mono text-xs text-mist">
              checking your data…
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
          placeholder="How long will my balance last?"
          aria-label="Ask the energy assistant"
          className={`${fieldDark} flex-1 text-[15px]`}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-volt px-5 text-[15px] font-semibold text-ink active:brightness-95 disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
