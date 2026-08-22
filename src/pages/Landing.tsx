import { Link } from "react-router";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

const steps = [
  ["01", "Pay", "Pick your meter, pick an amount — $10 to $100 — and pay. In the demo the payment is simulated; the engineering around it is not."],
  ["02", "Verify", "Every payment carries a unique reference. The database accepts it once, and only once — a duplicate or a replay can never credit twice."],
  ["03", "Credit", "Units land on the meter automatically and the balance moves in front of you. No 20-digit token, no queue, no guesswork."],
] as const;

const features = [
  ["Automatic crediting", "A verified payment becomes meter credit on its own. Idempotency is enforced by the database — not by hope.", null],
  ["Meter verification", "Connecting a meter checks it against a simulated national registry, with real failure states: disconnected, tampered, already claimed.", null],
  ["Live balance & usage", "A dashboard that reads like your meter: balance in kWh, daily consumption, and every credit on record.", null],
  ["Phone-first sign-in", "OTP to your phone, the way Zimbabwe signs in. Demo mode uses fixed codes; production swaps in a real SMS gateway with zero app changes.", null],
  ["Live meter telemetry", "A simulated smart meter publishes voltage, current and power over MQTT, streaming to the dashboard in realtime.", "Phase 2"],
  ["AI energy assistant", "Ask \u201chow long will my balance last?\u201d — answered from your actual usage through locked-down tools, never raw database access.", "Phase 3"],
] as const;

const stack = [
  "React 19",
  "TypeScript",
  "Vite",
  "Tailwind 4",
  "Supabase",
  "PostgreSQL + RLS",
  "MQTT",
  "PWA",
  "Vitest",
] as const;

const glass =
  "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm";

export default function Landing() {
  return (
    <div id="top" className="relative min-h-dvh overflow-hidden bg-night text-paper">
      {/* atmosphere: metering grid + soft national glows */}
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -top-32 right-[-8rem] h-96 w-96 rounded-full bg-volt/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-[38rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-credit/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-[-6rem] h-80 w-80 rounded-full bg-sky/10 blur-3xl" />

      <div className="relative">
        <SiteNav />

        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 lg:grid-cols-2 lg:pt-24">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-[11px] tracking-widest text-volt uppercase">
              Magetsi · prepaid electricity, reimagined
            </p>
            <h1 className="text-4xl leading-[1.06] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Power, credited
              <br />
              the moment you pay.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-mist sm:text-lg">
              ZimSmartMeter is an open-source proof-of-concept for Zimbabwe's
              prepaid grid — verified payments credit your meter automatically,
              and your balance, usage and history live on your phone.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="rounded-xl bg-volt px-6 py-4 text-center text-[15px] font-semibold text-ink active:brightness-95"
              >
                Try the live demo
              </Link>
              <a
                href="#how"
                className={`${glass} px-6 py-4 text-center text-[15px] font-semibold text-paper transition-colors hover:bg-white/10`}
              >
                See how it works
              </a>
            </div>
            <p className="text-xs text-mist">
              Free demo · fixed-code phone sign-in · no real money involved
            </p>
          </div>

          {/* Glass frame around the meter LCD */}
          <div className={`${glass} p-6 shadow-2xl shadow-black/40 backdrop-blur-md lg:p-8`}>
            <div className="rounded-xl border border-white/10 bg-lcd p-5 font-mono">
              <div className="mb-4 flex items-center justify-between text-[11px] tracking-widest uppercase">
                <span className="text-mist">Prepaid meter</span>
                <span className="text-mist">ZW-DEMO-001</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[11px] tracking-widest text-mist uppercase">
                    Balance
                  </div>
                  <div className="text-4xl font-medium text-phosphor">
                    142.6 <span className="text-lg">kWh</span>
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
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-[12px]">
                <div>
                  <div className="text-mist">Last credit</div>
                  <div className="text-phosphor">$20.00 · +58.8 kWh</div>
                </div>
                <div>
                  <div className="text-mist">Today's usage</div>
                  <div className="text-phosphor">6.2 kWh</div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-[11px] tracking-widest text-mist uppercase">
              Simulated demo meter — live in the dashboard
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16">
          <h2 className="font-mono text-[11px] tracking-widest text-volt uppercase">
            How it works
          </h2>
          <p className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Three steps, one guarantee: a payment credits exactly once.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(([n, title, detail]) => (
              <div key={n} className={`${glass} p-6`}>
                <span className="font-mono text-sm text-volt">{n}</span>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16">
          <h2 className="font-mono text-[11px] tracking-widest text-volt uppercase">
            Features
          </h2>
          <p className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Built like a real utility platform — honestly labelled as a demo.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, detail, phase]) => (
              <div key={title} className={`${glass} p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  {phase && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-mist uppercase">
                      {phase}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-mist">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Under the hood */}
        <section id="stack" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16">
          <div className={`${glass} p-8 lg:p-10`}>
            <h2 className="font-mono text-[11px] tracking-widest text-volt uppercase">
              Under the hood
            </h2>
            <p className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Every schema change is a migration. Every money path is a
              transaction.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist sm:text-base">
              Row Level Security guards every table, payment idempotency is a
              database constraint rather than a frontend check, and the whole
              build — decisions included — is public.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-sm text-mist"
                >
                  {item}
                </span>
              ))}
            </div>
            <a
              href="https://github.com/nobytechy/ZimSmartMeter"
              className="mt-6 inline-block text-sm font-medium text-volt underline underline-offset-4"
            >
              Read the source and build notes →
            </a>
          </div>
        </section>

        {/* Honest-demo notice */}
        <section className="mx-auto max-w-6xl px-5 py-4">
          <div className="rounded-2xl border border-volt/30 bg-volt/10 p-5 text-sm leading-relaxed text-paper/90">
            <span className="font-semibold">Independent demonstration.</span>{" "}
            ZimSmartMeter is not affiliated with ZESA or any utility. All
            meters, payments and balances are simulated demo data — no real
            electricity is bought or sold here.
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className={`${glass} flex flex-col items-center gap-5 p-10 text-center`}>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              See a payment become power.
            </h2>
            <p className="max-w-md text-sm text-mist">
              Sign in with a demo phone number and a fixed code — you'll be
              looking at a live meter in under a minute.
            </p>
            <Link
              to="/login"
              className="rounded-xl bg-volt px-8 py-4 text-[15px] font-semibold text-ink active:brightness-95"
            >
              Try the live demo
            </Link>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
