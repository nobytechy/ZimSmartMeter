import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import ActivityList from "../components/ActivityList";

const ConsumptionChart = lazy(() => import("../components/ConsumptionChart"));
import MeterCard from "../components/MeterCard";
import { glass } from "../components/ui";
import { useSession } from "../features/auth/sessionContext";
import { simulatedDailyUsage } from "../features/consumption/simulated";
import type { DayUsage } from "../features/consumption/simulated";
import { useMeters } from "../features/meters/useMeters";
import { useLowBalanceBeeper } from "../hooks/useLowBalanceBeeper";
import { useTransactions } from "../features/transactions/useTransactions";
import { signOut } from "../services/auth";
import { claimDemoMeter } from "../services/meters";
import { listUnread, markRead } from "../services/notifications";
import type { AppNotification } from "../services/notifications";
import { getDailyConsumption } from "../services/telemetry";
import { formatMeterNumber } from "../utils/meterNumber";
import { formatZimPhone } from "../utils/phone";

export default function Dashboard() {
  const { session } = useSession();
  const { meters, loading, error, refresh } = useMeters();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const { txns, loading: txnsLoading } = useTransactions(8);
  const [chartMeterId, setChartMeterId] = useState<string | null>(null);
  const [beeper, setBeeper] = useState(
    () => localStorage.getItem("zsm.beeper") !== "off",
  );
  useLowBalanceBeeper(meters, beeper);

  function toggleBeeper() {
    setBeeper((b) => {
      localStorage.setItem("zsm.beeper", b ? "off" : "on");
      return !b;
    });
  }

  const activeChartMeter =
    (meters ?? []).find((m) => m.id === chartMeterId) ?? (meters ?? [])[0];
  const [liveUsage, setLiveUsage] = useState<DayUsage[] | null>(null);
  const [notices, setNotices] = useState<AppNotification[]>([]);

  const chartKey = activeChartMeter
    ? `${activeChartMeter.id}:${activeChartMeter.balance_kwh}`
    : null;
  useEffect(() => {
    if (!chartKey) return;
    const id = chartKey.split(":")[0];
    // oxlint-disable-next-line react/set-state-in-effect
    void getDailyConsumption(id).then(setLiveUsage);
  }, [chartKey]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void listUnread().then(setNotices);
  }, [meters]);

  const liveMode = (liveUsage?.length ?? 0) > 0;
  const usage = useMemo(
    () =>
      liveMode
        ? (liveUsage as DayUsage[])
        : activeChartMeter
          ? simulatedDailyUsage(activeChartMeter.id)
          : [],
    [liveMode, liveUsage, activeChartMeter],
  );

  const rawPhone = session?.user.phone ?? "";
  const phone = rawPhone
    ? formatZimPhone("+" + rawPhone.replace(/^\+/, ""))
    : "—";

  async function demoMeter() {
    setBusy(true);
    setClaimError(null);
    const result = await claimDemoMeter();
    setBusy(false);
    if (!result.ok) {
      setClaimError(
        result.reason === "none_available"
          ? "All demo meters are taken — connect one by number instead."
          : result.reason,
      );
      return;
    }
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6 pt-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your meters</h1>
          <p className="mt-0.5 font-mono text-sm text-mist">{phone}</p>
        </div>
        <div className="flex items-center gap-4">
          {meters && meters.length > 0 && (
            <>
              <Link
                to="/app/simulator"
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Simulator
              </Link>
              <Link
                to="/app/meters/new"
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                + Connect a meter
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={toggleBeeper}
            title="Low-credit beeper, just like the real meter"
            className="font-mono text-xs text-mist underline underline-offset-4"
          >
            beeper: {beeper ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={() => {
              void signOut().then(() => navigate("/login", { replace: true }));
            }}
            className="text-sm text-mist underline underline-offset-4"
          >
            Sign out
          </button>
        </div>
      </div>

      {notices.map((n) => (
        <div
          key={n.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-volt/30 bg-volt/[0.08] p-4"
        >
          <div>
            <p className="text-sm font-semibold text-volt">{n.title}</p>
            {n.body && <p className="mt-0.5 text-sm text-mist">{n.body}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              void markRead(n.id).then(() =>
                setNotices((prev) => prev.filter((x) => x.id !== n.id)),
              );
            }}
            className="text-sm text-mist underline underline-offset-4"
          >
            Dismiss
          </button>
        </div>
      ))}

      {loading && (
        <p className="pt-8 text-center font-mono text-sm text-mist">…</p>
      )}

      {error && (
        <div className={`${glass} p-4`}>
          <p className="text-sm text-flare">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 text-sm text-mist underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      {meters && meters.length === 0 && (
        <div className={`${glass} flex flex-col gap-4 p-6`}>
          <div>
            <h2 className="text-lg font-semibold">No meters yet</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-mist">
              Claim a ready-made demo meter in one tap, or connect a meter by
              its 11-digit number and watch the registry verification answer.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => void demoMeter()}
              className="rounded-xl bg-volt px-5 py-4 text-[15px] font-semibold text-ink active:brightness-95 disabled:opacity-60"
            >
              {busy ? "Claiming…" : "Create my demo meter"}
            </button>
            <Link
              to="/app/meters/new"
              className="rounded-xl border border-white/15 px-5 py-4 text-center text-[15px] font-semibold hover:bg-white/5"
            >
              Connect existing meter
            </Link>
          </div>
          {claimError && <p className="text-sm text-flare">{claimError}</p>}
        </div>
      )}

      {meters && meters.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meters.map((m) => (
              <MeterCard key={m.id} meter={m} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className={`${glass} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-mono text-[11px] tracking-widest text-mist uppercase">
                  Daily consumption
                </h2>
                {meters.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {meters.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setChartMeterId(m.id)}
                        className={`rounded px-2 py-1 font-mono text-[11px] ${
                          activeChartMeter?.id === m.id
                            ? "bg-volt/15 text-volt"
                            : "text-mist hover:text-paper"
                        }`}
                      >
                        {m.nickname ?? formatMeterNumber(m.meter_number)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3">
                {activeChartMeter && (
                  <Suspense fallback={<div className="h-56" />}>
                    <ConsumptionChart data={usage} />
                  </Suspense>
                )}
              </div>
              <p className="mt-2 text-xs text-mist">
                {liveMode
                  ? "Live telemetry — recorded by your meter simulator over MQTT."
                  : "Simulated preview — start the Simulator and this becomes live telemetry."}
              </p>
            </section>

            <section className={`${glass} p-5`}>
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-[11px] tracking-widest text-mist uppercase">
                  Recent activity
                </h2>
                <Link
                  to="/app/activity"
                  className="text-xs text-mist underline underline-offset-4 hover:text-paper"
                >
                  View all
                </Link>
              </div>
              <div className="mt-2">
                {txnsLoading ? (
                  <p className="py-6 text-center font-mono text-sm text-mist">
                    …
                  </p>
                ) : (
                  <ActivityList txns={txns ?? []} />
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
