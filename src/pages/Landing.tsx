import { Link } from "react-router";

const readout = [
  ["Meter", "ZW-DEMO-001"],
  ["Balance", "142.6 kWh"],
  ["Status", "ONLINE"],
] as const;

const proofPoints = [
  ["Idempotent crediting", "a payment can never credit a meter twice"],
  ["Meter verification", "against a simulated ZESA-style registry"],
  ["Installable PWA", "the dashboard stays readable offline"],
] as const;

export default function Landing() {
  return (
    <div className="flex flex-col gap-10 pt-8 pb-12">
      <section className="flex flex-col gap-4">
        <p className="font-mono text-[11px] tracking-widest text-credit uppercase">
          Prepaid electricity · proof of concept
        </p>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight">
          Payment in.
          <br />
          Power credited.
        </h1>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          A verified payment becomes meter credit on its own — no token to
          type. Balance, usage and history live on your phone.
        </p>
      </section>

      <section
        aria-label="Demo meter readout"
        className="rounded-xl border border-line bg-white p-4 font-mono text-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-credit motion-safe:animate-pulse"
          />
          <span className="text-[11px] tracking-widest text-ink-soft uppercase">
            live demo meter
          </span>
        </div>
        <dl className="flex flex-col gap-2">
          {readout.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between">
              <dt className="text-ink-soft">{label}</dt>
              <dd className={value === "ONLINE" ? "text-credit" : ""}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <Link
          to="/login"
          className="rounded-xl bg-credit px-5 py-4 text-center text-[15px] font-semibold text-white active:bg-credit-deep"
        >
          Sign in with phone
        </Link>
        <a
          href="https://github.com/nobytechy/ZimSmartMeter"
          className="text-center text-sm text-ink-soft underline underline-offset-4"
        >
          Read how it's built
        </a>
      </section>

      <section aria-label="What this demonstrates" className="flex flex-col text-sm">
        {proofPoints.map(([title, detail]) => (
          <div key={title} className="border-t border-line py-3">
            <span className="font-medium">{title}</span>
            <span className="text-ink-soft"> — {detail}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
