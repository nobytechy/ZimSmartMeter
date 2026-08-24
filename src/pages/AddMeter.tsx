import { useState } from "react";
import Spinner from "../components/Spinner";
import { Link, useNavigate } from "react-router";
import { glass, fieldDark } from "../components/ui";
import { claimMeter } from "../services/meters";
import { useT } from "../i18n/context";
import type { TKey } from "../i18n/dict";
import {
  formatMeterNumber,
  isValidMeterNumber,
  normalizeMeterNumber,
} from "../utils/meterNumber";

const reasonKeys = {
  not_found: "meter.notFound",
  disconnected: "meter.disconnected",
  tampered: "meter.tampered",
  already_claimed: "meter.alreadyClaimed",
  already_yours: "meter.alreadyYours",
  bad_format: "meter.badFormat",
} as const;

const samples = ["04954653178", "04545682827", "04514800855"] as const;

/** Connect-a-meter wizard: instant Luhn feedback, authoritative server verdict. */
export default function AddMeter() {
  const t = useT();
  const navigate = useNavigate();
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = number.length === 11;
  const valid = complete && isValidMeterNumber(number);

  async function submit() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const result = await claimMeter(number);
    setBusy(false);
    if (!result.ok) {
      const key = reasonKeys[result.reason as keyof typeof reasonKeys] as
        | TKey
        | undefined;
      setError(key ? t(key) : result.reason);
      return;
    }
    navigate("/app", { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-10 pb-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("meter.connectTitle")}
        </h1>
        <p className="mt-1 text-[15px] text-mist">
          {t("meter.connectSub")}
        </p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          aria-label="Meter number"
          inputMode="numeric"
          placeholder="0495 4653 178"
          value={formatMeterNumber(number)}
          onChange={(e) => setNumber(normalizeMeterNumber(e.target.value))}
          className={`${fieldDark} font-mono text-lg tracking-wider`}
        />
        <p
          className={`font-mono text-xs ${
            !complete ? "text-mist" : valid ? "text-phosphor" : "text-flare"
          }`}
        >
          {!complete
            ? `${number.length}/11 ${t("meter.digits")}`
            : valid
              ? `✓ ${t("meter.formatValid")}`
              : t("meter.checkDigit")}
        </p>
        <button
          type="submit"
          disabled={!valid || busy}
          className="rounded-xl bg-volt px-5 py-4 text-[15px] font-semibold text-ink active:brightness-95 disabled:opacity-60"
        >
          {busy ? <><Spinner className="mr-2" />{t("meter.verifying")}</> : t("meter.verifyConnect")}
        </button>
      </form>

      {error && <p className="text-sm text-flare">{error}</p>}

      <div className={`${glass} p-4`}>
        <p className="font-mono text-[11px] tracking-widest text-mist uppercase">
          Try these — verification answers differently
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {samples.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setNumber(n);
                setError(null);
              }}
              className="rounded-lg border border-white/10 px-4 py-3 text-left font-mono text-sm text-paper hover:bg-white/5 active:bg-white/10"
            >
              {formatMeterNumber(n)}
            </button>
          ))}
        </div>
      </div>

      <Link
        to="/app"
        className="text-sm text-mist underline underline-offset-4"
      >
        {t("meter.backDash")}
      </Link>
    </div>
  );
}
