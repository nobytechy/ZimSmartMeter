import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { fieldDark, glass } from "../components/ui";
import { getMeter } from "../services/meters";
import {
  confirmCashPayment,
  gatewayCheck,
  gatewayInitiate,
  purchaseElectricity,
} from "../services/purchases";
import type {
  GatewayMethod,
  PaymentMethod,
  PurchasePending,
  PurchaseSuccess,
} from "../services/purchases";
import { getActiveTariff } from "../services/tariffs";
import type { Tariff } from "../services/tariffs";
import type { Meter } from "../types/meter";
import { isValidAmount } from "../utils/amount";
import { formatMeterNumber } from "../utils/meterNumber";
import { useT } from "../i18n/context";
import { computeKwh } from "../utils/tariff";

const quickAmounts = [5, 10, 20, 50, 100] as const;

const reasonMessages: Record<string, string> = {
  bad_amount: "Amount must be $5.00 to $1,000.00, two decimals at most.",
  meter_not_found: "This meter is not on your account.",
  method_unavailable: "That payment method isn't wired up yet.",
  no_active_tariff: "No active tariff is configured.",
  payment_not_found: "That payment doesn't exist on your account.",
};

type Step =
  | "amount"
  | "method"
  | "confirm"
  | "cashPending"
  | "gatewayPending"
  | "done";

/**
 * Buy wizard: amount → method → confirm → receipt (instant), with a
 * pending stop for cash. The idempotency key is minted when the amount
 * is locked in and reused for every retry — retries can never buy twice.
 */
export default function BuyPage() {
  const t = useT();
  const { meterId } = useParams<{ meterId: string }>();
  const [meter, setMeter] = useState<Meter | null>(null);
  const [tariff, setTariff] = useState<Tariff | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("amount");
  const [amountInput, setAmountInput] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("instant");
  const [idemKey, setIdemKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPay, setPendingPay] = useState<PurchasePending | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [gwStatus, setGwStatus] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseSuccess | null>(null);

  useEffect(() => {
    if (!meterId) return;
    void Promise.all([getMeter(meterId), getActiveTariff()]).then(([m, t]) => {
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
    });
  }, [meterId]);

  const amountValid = isValidAmount(amountInput);

  const kwhFor = (a: number) =>
    tariff ? computeKwh(a, tariff.rate_kwh_per_usd).toFixed(1) : "—";

  function lockAmount() {
    if (!amountValid) {
      setError(reasonMessages.bad_amount);
      return;
    }
    setAmount(Number(amountInput));
    setIdemKey(crypto.randomUUID()); // one key per intent
    setError(null);
    setStep("method");
  }

  async function pay() {
    if (!meter || !amount || !idemKey) return;
    setBusy(true);
    setError(null);
    const res = await purchaseElectricity(meter.id, amount, idemKey, method);
    setBusy(false);
    if (!res.ok) {
      setError(reasonMessages[res.reason] ?? res.reason);
      return;
    }
    if (res.pending) {
      setPendingPay(res);
      setStep(res.method === "cash" ? "cashPending" : "gatewayPending");
      return;
    }
    setResult(res);
    setStep("done");
  }

  useEffect(() => {
    if (step !== "gatewayPending" || !pendingPay) return;
    let cancelled = false;

    const gw = pendingPay.method as GatewayMethod;
    void gatewayInitiate(gw, pendingPay.payment_ref).then((res) => {
      if (cancelled) return;
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setGatewayUrl(res.browser_url);
    });

    const poll = setInterval(() => {
      void gatewayCheck(gw, pendingPay.payment_ref).then((res) => {
        if (cancelled || "error" in res) return;
        if (!res.settled) {
          setGwStatus(res.outcome);
          return;
        }
        if (res.settled) {
          clearInterval(poll);
          if (res.outcome === "paid" && res.receipt.ok && !res.receipt.pending) {
            setResult(res.receipt);
            setStep("done");
          } else {
            setError("The gateway reported this payment as failed.");
          }
        }
      });
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pendingPay]);

  async function checkNow() {
    if (!pendingPay) return;
    setBusy(true);
    setError(null);
    const res = await gatewayCheck(
      pendingPay.method as GatewayMethod,
      pendingPay.payment_ref,
    );
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (!res.settled) {
      setGwStatus(res.outcome);
      return;
    }
    if (res.outcome === "paid" && res.receipt.ok && !res.receipt.pending) {
      setResult(res.receipt);
      setStep("done");
    } else {
      setError("The gateway reported this payment as failed.");
    }
  }

  async function agentConfirm() {
    if (!pendingPay) return;
    setBusy(true);
    setError(null);
    const res = await confirmCashPayment(pendingPay.payment_id);
    setBusy(false);
    if (!res.ok) {
      setError(reasonMessages[res.reason] ?? res.reason);
      return;
    }
    if (!res.pending) {
      setResult(res);
      setStep("done");
    }
  }

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
    return <p className="pt-16 text-center font-mono text-sm text-mist">…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-10 pb-16">
      {step === "amount" && (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("buy.amountTitle")}
            </h1>
            <p className="mt-1 font-mono text-sm text-mist">
              {meter.nickname ?? formatMeterNumber(meter.meter_number)} ·
              balance {meter.balance_kwh.toFixed(1)} kWh
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmountInput(String(a))}
                className={`rounded-lg border px-4 py-2 font-mono text-sm ${
                  amountInput === String(a)
                    ? "border-volt text-volt"
                    : "border-white/15 text-paper hover:bg-white/5"
                }`}
              >
                ${a}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="amount">
              {t("buy.amountLabel")}
            </label>
            <input
              id="amount"
              inputMode="decimal"
              placeholder="7.50"
              value={amountInput}
              onChange={(e) =>
                setAmountInput(e.target.value.replace(/[^\d.]/g, ""))
              }
              className={`${fieldDark} font-mono text-lg`}
            />
            <p className="font-mono text-xs text-mist">
              {amountValid
                ? `≈ ${kwhFor(Number(amountInput))} kWh at ${tariff.rate_kwh_per_usd.toFixed(2)} kWh/$`
                : "$5.00 – $1,000.00"}
            </p>
          </div>
          <button
            type="button"
            disabled={!amountValid}
            onClick={lockAmount}
            className="rounded-xl bg-volt px-5 py-4 text-[15px] font-semibold text-ink active:brightness-95 disabled:opacity-60"
          >
            {t("buy.continue")}
          </button>
          {error && <p className="text-sm text-flare">{error}</p>}
          <Link to="/app" className="text-sm text-mist underline underline-offset-4">
            {t("buy.cancel")}
          </Link>
        </>
      )}

      {step === "method" && amount && (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("buy.methodTitle")}
            </h1>
            <p className="mt-1 font-mono text-sm text-mist">
              ${amount.toFixed(2)} → {kwhFor(amount)} kWh
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setMethod("instant");
                setStep("confirm");
              }}
              className={`${glass} p-4 text-left hover:border-volt/50`}
            >
              <div className="font-semibold">{t("buy.instant")}</div>
              <p className="mt-1 text-sm text-mist">
                {t("buy.instantB")}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("cash");
                setStep("confirm");
              }}
              className={`${glass} p-4 text-left hover:border-volt/50`}
            >
              <div className="font-semibold">{t("buy.cash")}</div>
              <p className="mt-1 text-sm text-mist">
                {t("buy.cashB")}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("paynow");
                setStep("confirm");
              }}
              className={`${glass} p-4 text-left hover:border-volt/50`}
            >
              <div className="font-semibold">PayNow · direct</div>
              <p className="mt-1 text-sm text-mist">
                The raw gateway protocol — EcoCash, OneMoney, cards. Test
                mode.
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("manishapay");
                setStep("confirm");
              }}
              className={`${glass} p-4 text-left hover:border-volt/50`}
            >
              <div className="font-semibold">ManishaPay</div>
              <p className="mt-1 text-sm text-mist">
                EcoCash, cards &amp; more — one gateway, simulated mode.
              </p>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStep("amount")}
            className="text-sm text-mist underline underline-offset-4"
          >
            {t("buy.changeAmount")}
          </button>
        </>
      )}

      {step === "confirm" && amount && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("buy.confirmTitle")}
          </h1>
          <div className={`${glass} flex flex-col gap-3 p-5 font-mono text-sm`}>
            <div className="flex justify-between">
              <span className="text-mist">{t("buy.meter")}</span>
              <span>
                {meter.nickname ?? formatMeterNumber(meter.meter_number)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist">{t("buy.method")}</span>
              <span>
                {method === "cash"
                  ? "Cash at agent"
                  : method === "manishapay"
                    ? "ManishaPay"
                    : method === "paynow"
                      ? "PayNow (direct)"
                      : "Instant"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist">{t("buy.amount")}</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3">
              <span className="text-mist">{t("buy.youReceive")}</span>
              <span className="text-phosphor">{kwhFor(amount)} kWh</span>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void pay()}
            className="rounded-xl bg-credit px-5 py-4 text-[15px] font-semibold text-white active:bg-credit-deep disabled:opacity-60"
          >
            {busy
              ? t("buy.processing")
              : method === "instant"
                ? `Pay $${amount.toFixed(2)} (simulated)`
                : t("buy.reserve")}
          </button>
          {error && <p className="text-sm text-flare">{error}</p>}
          <button
            type="button"
            onClick={() => setStep("method")}
            className="text-sm text-mist underline underline-offset-4"
          >
            {t("buy.back")}
          </button>
        </>
      )}

      {step === "cashPending" && pendingPay && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pay cash at an agent
          </h1>
          <div className="rounded-xl bg-lcd p-5 font-mono">
            <div className="text-[11px] tracking-widest text-mist uppercase">
              Quote this reference
            </div>
            <div className="mt-2 text-3xl font-medium text-phosphor">
              {pendingPay.payment_ref}
            </div>
            <div className="mt-3 border-t border-white/10 pt-3 text-sm text-mist">
              ${pendingPay.amount_usd.toFixed(2)} · awaiting agent confirmation
            </div>
          </div>
          <p className="text-sm leading-relaxed text-mist">
            Nothing has been credited yet — the reference just reserves your
            payment. When the agent takes the cash, they confirm it and the
            meter credits atomically.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void agentConfirm()}
            className="rounded-xl bg-volt px-5 py-4 text-[15px] font-semibold text-ink active:brightness-95 disabled:opacity-60"
          >
            {busy ? "Confirming…" : "Simulate agent confirmation"}
          </button>
          {error && <p className="text-sm text-flare">{error}</p>}
          <Link to="/app" className="text-sm text-mist underline underline-offset-4">
            {t("buy.later")}
          </Link>
        </>
      )}

      {step === "gatewayPending" && pendingPay && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pay with {pendingPay.method === "paynow" ? "PayNow" : "ManishaPay"}
          </h1>
          <div className="rounded-xl bg-lcd p-5 font-mono">
            <div className="text-[11px] tracking-widest text-mist uppercase">
              Gateway reference
            </div>
            <div className="mt-2 text-3xl font-medium text-phosphor">
              {pendingPay.payment_ref}
            </div>
            <div className="mt-3 border-t border-white/10 pt-3 text-sm text-mist">
              ${pendingPay.amount_usd.toFixed(2)} · awaiting the gateway
            </div>
          </div>
          {gatewayUrl ? (
            <a
              href={gatewayUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-volt px-5 py-4 text-center text-[15px] font-semibold text-ink active:brightness-95"
            >
              Open {pendingPay.method === "paynow" ? "PayNow" : "ManishaPay"}{" "}
              checkout
            </a>
          ) : (
            <p className="text-center font-mono text-sm text-mist">
              Preparing checkout…
            </p>
          )}
          <p className="text-sm leading-relaxed text-mist">
            Complete the payment in the checkout tab. This screen checks the
            gateway every few seconds and credits the meter the moment it
            reports <span className="font-mono text-paper">paid</span>.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkNow()}
            className="rounded-xl border border-white/15 px-5 py-4 text-[15px] font-semibold hover:bg-white/5 disabled:opacity-60"
          >
            {busy ? t("buy.checking") : t("buy.checkNow")}
          </button>
          {gwStatus && (
            <p className="text-center font-mono text-xs text-mist">
              gateway says: {gwStatus} — finish the payment in the checkout
              tab. PayNow test mode only lets the merchant account fake a
              success.
            </p>
          )}
          {error && <p className="text-sm text-flare">{error}</p>}
          <Link to="/app" className="text-sm text-mist underline underline-offset-4">
            Later — back to dashboard
          </Link>
        </>
      )}

      {step === "done" && result && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("buy.credited")}
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
              {t("buy.newBalance")}{" "}
              <span className="text-phosphor">
                {result.new_balance.toFixed(1)} kWh
              </span>{" "}
              · ${result.amount_usd.toFixed(2)} ·{" "}
              {result.method === "cash"
                ? "cash"
                : result.method === "manishapay"
                  ? "ManishaPay"
                  : result.method === "paynow"
                    ? "PayNow"
                    : "instant"}
            </div>
          </div>
          {result.duplicate && (
            <div className={`${glass} p-4 text-sm leading-relaxed text-mist`}>
              This payment event had already been processed — the original
              result was returned and{" "}
              <span className="text-paper">no second credit</span> was issued.
            </div>
          )}
          <Link
            to="/app"
            className="rounded-xl bg-volt px-5 py-4 text-center text-[15px] font-semibold text-ink active:brightness-95"
          >
            {t("buy.done")}
          </Link>
        </>
      )}
    </div>
  );
}
