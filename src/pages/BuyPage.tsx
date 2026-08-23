import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { fieldDark, glass } from "../components/ui";
import { getMeter } from "../services/meters";
import { purchaseElectricity } from "../services/purchases";
import type { PurchaseResult } from "../services/purchases";
import { getActiveTariff } from "../services/tariffs";
import type { Tariff } from "../services/tariffs";
import type { Meter } from "../types/meter";
import { formatMeterNumber } from "../utils/meterNumber";

const denominations = [10, 20, 50, 100] as const;

/**
 * Buy wizard: pick amount → confirm → receipt.
 * The idempotency key is minted ONCE when an amount is chosen and reused
 * for every retry of that confirmation — so a double-tap, a flaky network
 * retry, or an impatient thumb can never buy twice.
 */
export default function BuyPage() {
  const { meterId } = useParams<{ meterId: string }>();
  const [meter, setMeter] = useState<Meter | null>(null);
  const [tariff, setTariff] = useState<Tariff | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [idemKey, setIdemKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<
    PurchaseResult,
    { ok: true }
  > | null>(null);

  useEffect(() => {
    if (!meterId) return;
    void Promise.all([getMeter(meterId), getActiveTariff()]).then(
      ([m, t]) => {
        if (m.error || !m.data) {
          setLoadError(m.error ?? "Meter not found.");
          return;
        }
        if (t.error || !t.data) {
          setLoadError(t.error ?? "No active tariff.");
          return;
        }
        setMeter(m.data);
        setTariff(t.data);
      },
    );
  }, [meterId]);

  function choose(a: number) {
    setAmount(a);
    setIdemKey(crypto.randomUUID()); // one key per intent
    setError(null);
  }

  async function pay() {
    if (!meter || !amount || !idemKey) return;
    setBusy(true);
    setError(null);
    const res = await purchaseElectricity(meter.id, amount, idemKey);
    setBusy(false);
    if (!res.ok) {
      setError(
        res.reason === "meter_not_found"
          ? "This meter is not on your account."
          : res.reason,
      );
      return;
    }
    setResult(res);
  }

  const kwhFor = (a: number) =>
    tariff ? (a * tariff.rate_kwh_per_usd).toFixed(1) : "—";

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 pt-10">
        <p className="text-sm text-flare">{loadError}</p>
        <Link to="/app" className="text-sm text-mist underline underline-offset-4">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!meter || !tariff) {
    return (
      <p className="pt-16 text-center font-mono text-sm text-mist">…</p>
    );
  }

  // ── receipt ──────────────────────────────────────────────
  if (result) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-10 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Power credited
        </h1>
        <div className="rounded-xl bg-lcd p-5 font-mono">
          <div className="flex items-center justify-between text-[11px] tracking-widest text-mist uppercase">
            <span>{result.payment_ref}</span>
            <span>{formatMeterNumber(meter.meter_number)}</span>
          </div>
          <div className="mt-4 text-4xl font-medium text-phosphor">
            +{result.kwh.toFixed(1)} <span className="text-lg">kWh</span>
          </div>
          <div className="mt-3 border-t border-white/10 pt-3 text-sm text-mist">
            New balance{" "}
            <span className="text-phosphor">
              {result.new_balance.toFixed(1)} kWh
            </span>{" "}
            · ${result.amount_usd.toFixed(2)}
          </div>
        </div>
        {result.duplicate && (
          <div className={`${glass} p-4 text-sm leading-relaxed text-mist`}>
            This payment event had already been processed — the original
            result was returned and{" "}
            <span className="text-paper">no second credit</span> was issued.
            That's idempotency doing its job.
          </div>
        )}
        <Link
          to="/app"
          className="rounded-xl bg-volt px-5 py-4 text-center text-[15px] font-semibold text-ink active:brightness-95"
        >
          Done
        </Link>
      </div>
    );
  }

  // ── confirm ──────────────────────────────────────────────
  if (amount) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-10 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Confirm purchase
        </h1>
        <div className={`${glass} flex flex-col gap-3 p-5 font-mono text-sm`}>
          <div className="flex justify-between">
            <span className="text-mist">Meter</span>
            <span>{meter.nickname ?? formatMeterNumber(meter.meter_number)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Amount</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Rate</span>
            <span>{tariff.rate_kwh_per_usd.toFixed(2)} kWh / $</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-mist">You receive</span>
            <span className="text-phosphor">{kwhFor(amount)} kWh</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Balance after</span>
            <span className="text-phosphor">
              {(meter.balance_kwh + amount * tariff.rate_kwh_per_usd).toFixed(1)}{" "}
              kWh
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void pay()}
          className="rounded-xl bg-credit px-5 py-4 text-[15px] font-semibold text-white active:bg-credit-deep disabled:opacity-60"
        >
          {busy ? "Processing…" : `Pay $${amount} (simulated)`}
        </button>
        {error && <p className="text-sm text-flare">{error}</p>}
        <button
          type="button"
          onClick={() => {
            setAmount(null);
            setIdemKey(null);
            setError(null);
          }}
          className="text-sm text-mist underline underline-offset-4"
        >
          Change amount
        </button>
      </div>
    );
  }

  // ── amount ───────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-10 pb-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Buy electricity
        </h1>
        <p className="mt-1 font-mono text-sm text-mist">
          {meter.nickname ?? formatMeterNumber(meter.meter_number)} · balance{" "}
          {meter.balance_kwh.toFixed(1)} kWh
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {denominations.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => choose(a)}
            className={`${fieldDark} flex flex-col items-start gap-1 py-4 text-left hover:border-volt`}
          >
            <span className="text-2xl font-semibold">${a}</span>
            <span className="font-mono text-xs text-mist">
              {kwhFor(a)} kWh
            </span>
          </button>
        ))}
      </div>
      <Link to="/app" className="text-sm text-mist underline underline-offset-4">
        Cancel
      </Link>
    </div>
  );
}
