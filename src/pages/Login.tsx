import { useState } from "react";
import Spinner from "../components/Spinner";
import { Link, Navigate, useNavigate } from "react-router";
import { useSession } from "../features/auth/sessionContext";
import { requestOtp, verifyOtp } from "../services/auth";
import { formatZimPhone, normalizeZimPhone } from "../utils/phone";
import { useT } from "../i18n/context";
import { fieldDark, glass } from "../components/ui";

const demoNumbers = ["0770000001", "0770000002", "0770000003"] as const;

/** Two-step wizard: phone → six-digit code. Demo numbers sign in one-tap. */
export default function Login() {
  const t = useT();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState(""); // normalized E.164
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) return <Navigate to="/app" replace />;

  async function sendCode(raw: string) {
    const normalized = normalizeZimPhone(raw);
    if (!normalized) {
      setError("Enter a valid Zimbabwean mobile — 07… or +263 7…");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await requestOtp(normalized);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setPhone(normalized);
    setCode("");
    setStep("code");
  }

  async function confirmCode() {
    if (!/^\d{6}$/.test(code)) {
      setError("The code is 6 digits.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await verifyOtp(phone, code);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    navigate("/app", { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-6 pb-16">
      <Link
        to="/"
        className="flex items-center gap-2 self-start text-sm text-mist hover:text-paper"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t("login.backSite")}
      </Link>
      {step === "phone" ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("login.title")}</h1>
            <p className="mt-1 text-[15px] text-mist">
              {t("login.sub")}
            </p>
          </div>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode(phoneInput);
            }}
          >
            <label className="text-sm font-medium" htmlFor="phone">
              {t("login.phone")}
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="07… or +263 7…"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className={`${fieldDark} font-mono text-[15px]`}
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-volt px-5 py-4 text-[15px] font-semibold text-ink active:brightness-95 disabled:opacity-60"
            >
              {busy ? <><Spinner className="mr-2" />{t("login.sending")}</> : t("login.send")}
            </button>
          </form>

          <div className={`${glass} p-4`}>
            <p className="font-mono text-[11px] tracking-widest text-mist uppercase">
              {t("login.demoAccess")}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {demoNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPhoneInput(n);
                    void sendCode(n);
                  }}
                  className="rounded-lg border border-white/10 px-4 py-3 text-left font-mono text-sm text-paper hover:bg-white/5 active:bg-white/10"
                >
                  {formatZimPhone(normalizeZimPhone(n) ?? n)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-mist">
              Code for every demo number: <span className="font-mono">123456</span>
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("login.codeTitle")}
            </h1>
            <p className="mt-1 text-[15px] text-mist">
              Sent to {formatZimPhone(phone)} — demo numbers use{" "}
              <span className="font-mono">123456</span>.
            </p>
          </div>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void confirmCode();
            }}
          >
            <input
              aria-label="One-time code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${fieldDark} text-center font-mono text-2xl tracking-[0.5em]`}
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-volt px-5 py-4 text-[15px] font-semibold text-ink active:brightness-95 disabled:opacity-60"
            >
              {busy ? <><Spinner className="mr-2" />{t("login.sending")}</> : t("login.verify")}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
              className="py-2 text-sm text-mist underline underline-offset-4"
            >
              {t("login.changeNumber")}
            </button>
          </form>
        </>
      )}
      {error && <p className="text-sm text-flare">{error}</p>}
    </div>
  );
}
