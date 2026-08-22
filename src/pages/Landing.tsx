import { Link } from "react-router";

const steps = [
  ["01", "Pay", "Choose your meter and an amount — $10 to $100."],
  ["02", "Verify", "The payment is checked once, and only once. A duplicate can never credit twice."],
  ["03", "Credit", "Units land on the meter automatically. Watch the balance move, live."],
] as const;

const proofPoints = [
  ["Idempotent crediting", "double-crediting is structurally impossible"],
  ["Meter verification", "against a simulated ZESA-style registry"],
  ["Installable PWA", "the dashboard stays readable offline"],
] as const;

export default function Landing() {
  return (
    <div className="flex flex-col gap-10 pt-6 pb-12">
      {/* Hero — navy panel, national fintech register */}
      <section className="flex flex-col gap-5 rounded-2xl bg-ink p-6 text-paper">
        <p className="font-mono text-[11px] tracking-widest text-volt uppercase">
          Magetsi · prepaid electricity
        </p>
        <h1 className="text-[2.4rem] leading-[1.08] font-bold tracking-tight">
          Power, credited
          <br />
          the moment you pay.
        </h1>
        <p className="text-[15px] leading-relaxed text-mist">
          A Zimbabwean proof-of-concept where a verified payment becomes meter
          credit automatically — no 20-digit token to type. Balance, usage and
          history on your phone.
        </p>

        {/* Meter LCD — the readout, styled like the real thing */}
        <div className="rounded-xl border border-white/10 bg-lcd p-4 font-mono">
          <div className="mb-3 flex items-center justify-between text-[11px] tracking-widest uppercase">
            <span className="text-mist">Prepaid meter</span>
            <span className="text-mist">ZW-DEMO-001</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] tracking-widest text-mist uppercase">
                Balance
              </div>
              <div className="text-3xl font-medium text-phosphor">
                142.6 <span className="text-base">kWh</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1 text-[13px] text-phosphor">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full bg-phosphor motion-safe:animate-pulse"
              />
              ONLINE
            </div>
          </div>
          <div className="mt-3 border-t border-white/10 pt-2 text-[12px] text-mist">
            Last credit&nbsp;&nbsp;$20.00 · +58.8 kWh
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            to="/login"
            className="rounded-xl bg-volt px-5 py-4 text-center text-[15px] font-semibold text-ink active:brightness-95"
          >
            Sign in with phone
          </Link>
          <p className="text-center text-xs text-mist">
            Demo numbers with fixed codes — no real SMS needed.
          </p>
        </div>
      </section>

      {/* The flow — a true sequence, so the numbering means something */}
      <section aria-label="How it works" className="flex flex-col gap-1">
        <h2 className="mb-2 font-mono text-[11px] tracking-widest text-ink-soft uppercase">
          How it works
        </h2>
        {steps.map(([n, title, detail]) => (
          <div key={n} className="flex gap-4 border-t border-line py-4">
            <span className="font-mono text-sm text-credit">{n}</span>
            <div>
              <div className="font-semibold">{title}</div>
              <div className="mt-0.5 text-sm leading-relaxed text-ink-soft">
                {detail}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Engineering proof points */}
      <section aria-label="What this demonstrates" className="flex flex-col text-sm">
        <h2 className="mb-2 font-mono text-[11px] tracking-widest text-ink-soft uppercase">
          Under the hood
        </h2>
        {proofPoints.map(([title, detail]) => (
          <div key={title} className="border-t border-line py-3">
            <span className="font-medium">{title}</span>
            <span className="text-ink-soft"> — {detail}</span>
          </div>
        ))}
        <a
          href="https://github.com/nobytechy/ZimSmartMeter"
          className="mt-4 text-sm text-credit underline underline-offset-4"
        >
          Read how it's built — open source
        </a>
      </section>
    </div>
  );
}
