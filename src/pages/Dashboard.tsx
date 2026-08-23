import { useState } from "react";
import { Link, useNavigate } from "react-router";
import MeterCard from "../components/MeterCard";
import { glass } from "../components/ui";
import { useSession } from "../features/auth/sessionContext";
import { useMeters } from "../features/meters/useMeters";
import { signOut } from "../services/auth";
import { claimDemoMeter } from "../services/meters";
import { formatZimPhone } from "../utils/phone";

export default function Dashboard() {
  const { session } = useSession();
  const { meters, loading, error, refresh } = useMeters();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

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
            <Link
              to="/app/meters/new"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
            >
              + Connect a meter
            </Link>
          )}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map((m) => (
            <MeterCard key={m.id} meter={m} />
          ))}
        </div>
      )}
    </div>
  );
}
