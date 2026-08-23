import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useSession } from "../features/auth/sessionContext";
import { requestOtp, verifyOtp } from "../services/auth";
import { formatZimPhone, normalizeZimPhone } from "../utils/phone";

const demoNumbers = ["0770000001", "0770000002", "0770000003"] as const;

/** Two-step wizard: phone → six-digit code. Demo numbers sign in one-tap. */
export default function Login() {
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
    <div className="flex flex-col gap-6 pt-8">
      {step === "phone" ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-[15px] text-ink-soft">
              We send a one-time code to your phone.
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
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="07… or +263 7…"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="rounded-xl border border-line bg-white px-4 py-3.5 font-mono text-[15px] outline-none focus:border-credit"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-credit px-5 py-4 text-[15px] font-semibold text-white active:bg-credit-deep disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          </form>

          <div className="rounded-xl border border-line bg-white p-4">
            <p className="font-mono text-[11px] tracking-widest text-ink-soft uppercase">
              Demo access · no SMS needed
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
                  className="rounded-lg border border-line px-4 py-3 text-left font-mono text-sm active:bg-paper"
                >
                  {formatZimPhone(normalizeZimPhone(n) ?? n)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-soft">
              Code for every demo number: <span className="font-mono">123456</span>
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Enter the code
            </h1>
            <p className="mt-1 text-[15px] text-ink-soft">
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
              className="rounded-xl border border-line bg-white px-4 py-3.5 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-credit"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-credit px-5 py-4 text-[15px] font-semibold text-white active:bg-credit-deep disabled:opacity-60"
            >
              {busy ? "Checking…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
              className="py-2 text-sm text-ink-soft underline underline-offset-4"
            >
              Change number
            </button>
          </form>
        </>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
