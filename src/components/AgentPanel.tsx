import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  approveProposal,
  getSettings,
  listOpenEvents,
  runNoby,
  saveSettings,
  setEventStatus,
} from "../services/agent";
import type { AgentEvent, AgentSettings } from "../services/agent";
import { glass } from "./ui";

/**
 * Agent Noby's dashboard presence: open proposals and alerts with one-tap
 * human approval, the standing-rule settings, and a run-now button.
 * The agent proposes; this panel is where a human decides.
 */
export default function AgentPanel() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [ev, st] = await Promise.all([listOpenEvents(), getSettings()]);
    setEvents(ev);
    setSettings(
      st ?? {
        enabled: true,
        low_threshold_kwh: 10,
        auto_topup: false,
        auto_topup_usd: null,
      },
    );
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh();
    const channel = supabase
      .channel("agent-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_events" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  async function approve(ev: AgentEvent) {
    setBusyId(ev.id);
    setError(null);
    const res = await approveProposal(ev);
    setBusyId(null);
    if (!res.ok) setError("reason" in res ? res.reason : "approval failed");
    await refresh();
  }

  async function checkNow() {
    setChecking(true);
    setError(null);
    await runNoby();
    setChecking(false);
    await refresh();
  }

  if (!settings) return null;

  return (
    <section className={`${glass} flex flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-mist uppercase">
          <span aria-hidden className="h-2 w-2 rounded-full bg-volt motion-safe:animate-pulse" />
          Agent Noby
        </h2>
        <button
          type="button"
          disabled={checking}
          onClick={() => void checkNow()}
          className="font-mono text-xs text-mist underline underline-offset-4 disabled:opacity-60"
        >
          {checking ? "checking…" : "run check now"}
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-mist">
          Watching your meters every few minutes — nothing needs you right
          now. Proposals and alerts land here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((ev) => (
            <div key={ev.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold">{ev.title}</p>
              {ev.body && (
                <p className="mt-1 text-sm leading-relaxed text-mist">{ev.body}</p>
              )}
              <div className="mt-3 flex items-center gap-4">
                {ev.kind === "low_balance_proposal" && ev.data?.suggested_usd && (
                  <button
                    type="button"
                    disabled={busyId === ev.id}
                    onClick={() => void approve(ev)}
                    className="rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-ink active:brightness-95 disabled:opacity-60"
                  >
                    {busyId === ev.id
                      ? "Buying…"
                      : `Approve $${ev.data.suggested_usd}`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void setEventStatus(ev.id, "dismissed").then(refresh)}
                  className="text-sm text-mist underline underline-offset-4"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-flare">{error}</p>}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-4 font-mono text-xs text-mist">
        <label className="flex items-center gap-2">
          alert below
          <input
            type="number"
            min={1}
            max={100}
            value={settings.low_threshold_kwh}
            onChange={(e) =>
              setSettings({ ...settings, low_threshold_kwh: Number(e.target.value) })
            }
            onBlur={() =>
              void saveSettings({ low_threshold_kwh: settings.low_threshold_kwh })
            }
            className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-paper"
          />
          kWh
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.auto_topup}
            onChange={(e) => {
              const next = { ...settings, auto_topup: e.target.checked };
              setSettings(next);
              void saveSettings({ auto_topup: next.auto_topup });
            }}
            className="accent-[#f5c518]"
          />
          auto top-up
        </label>
        {settings.auto_topup && (
          <label className="flex items-center gap-2">
            $
            <input
              type="number"
              min={5}
              max={1000}
              value={settings.auto_topup_usd ?? 10}
              onChange={(e) =>
                setSettings({ ...settings, auto_topup_usd: Number(e.target.value) })
              }
              onBlur={() =>
                void saveSettings({ auto_topup_usd: settings.auto_topup_usd ?? 10 })
              }
              className="w-20 rounded border border-white/15 bg-white/5 px-2 py-1 text-paper"
            />
            when low · max once / 6h
          </label>
        )}
      </div>
    </section>
  );
}
