import { Link } from "react-router";
import Mark from "../components/Mark";
import ProcessAnimation from "../components/ProcessAnimation";
import AccentLine from "../components/AccentLine";

/** Shared glass surface — the one decorative idea, used consistently. */
const glass =
  "rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl";

const navLinks = [
  ["#how", "How it works"],
  ["#features", "Features"],
  ["#technology", "Technology"],
] as const;

const steps = [
  ["01", "Pay", "Choose your meter and an amount — $10 to $100 — priced by a configurable tariff."],
  ["02", "Verify", "The payment is checked once, and only once. A duplicate event can never credit twice — the database guarantees it."],
  ["03", "Credit", "Units land on the meter automatically. Balance and history update live on your phone."],
] as const;

const features = [
  ["Automatic crediting", "A verified payment becomes meter credit on its own. No 20-digit token, no typing, no queue."],
  ["Duplicate-proof payments", "Idempotent processing enforced by unique database constraints — double-crediting is structurally impossible."],
  ["Verified meters", "Every meter number is checked against a simulated ZESA-style registry: format, status, and ownership."],
  ["Live balance & usage", "A meter-style readout of your balance, daily consumption, and every transaction on record."],
  ["Works offline", "Installable PWA. The dashboard stays readable without signal — payments sensibly require a connection."],
  ["AI energy assistant", "Ask how long your balance will last. Answers come from real usage data through controlled tools."],
] as const;

const stack = [
  "React 19",
  "TypeScript",
  "Vite",
  "Tailwind CSS",
  "Supabase",
  "PostgreSQL + RLS",
  "MQTT",
  "PWA",
  "Netlify",
] as const;

export default function Landing() {
  return (
    <div className="min-h-dvh bg-night text-paper">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-night/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <Mark size={24} />
            <span className="font-mono text-sm font-medium tracking-tight">
              ZimSmartMeter
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-mist md:flex">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} className="hover:text-paper">
                {label}
              </a>
            ))}
            <a
              href="https://github.com/nobytechy/ZimSmartMeter"
              className="hover:text-paper"
            >
              GitHub
            </a>
          </div>
          <Link
            to="/login"
            className="rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-ink active:brightness-95"
          >
            Sign in
          </Link>
        </nav>
        <AccentLine />
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden">
        {/* ambient glow field behind the glass */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-credit opacity-20 blur-3xl" />
          <div className="absolute top-24 -right-40 h-[30rem] w-[30rem] rounded-full bg-sky opacity-15 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-volt opacity-10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 lg:grid-cols-2 lg:pt-24 lg:pb-28">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-[11px] tracking-widest text-volt uppercase">
              Magetsi · prepaid electricity · demo
            </p>
            <h1 className="text-5xl leading-[1.05] font-bold tracking-tight md:text-6xl">
              Power, credited the moment you pay.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-mist">
              ZimSmartMeter is an independent Zimbabwean proof-of-concept: a
              verified payment becomes meter credit automatically — no 20-digit
              token to type. Balance, usage and history, live on any phone.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-volt px-6 py-4 text-[15px] font-semibold text-ink active:brightness-95"
              >
                Sign in with phone
              </Link>
              <a
                href="https://github.com/nobytechy/ZimSmartMeter"
                className="rounded-xl border border-white/15 px-6 py-4 text-[15px] font-semibold text-paper hover:bg-white/5"
              >
                View the source
              </a>
            </div>
            <p className="text-sm text-mist">
              Demo phone numbers with fixed codes — no real SMS needed. Open
              source, built in Zimbabwe.
            </p>
          </div>

          {/* Product visual — glass panel around a meter LCD */}
          <div className={`${glass} p-6`}>
            <div className="rounded-xl bg-lcd p-5 font-mono">
              <div className="mb-4 flex items-center justify-between text-[11px] tracking-widest uppercase">
                <span className="text-mist">Prepaid meter</span>
                <span className="text-mist">ZW-DEMO-001</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[11px] tracking-widest text-mist uppercase">
                    Balance
                  </div>
                  <div className="text-5xl font-medium text-phosphor">
                    142.6 <span className="text-xl">kWh</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pb-1.5 text-[13px] text-phosphor">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-phosphor motion-safe:animate-pulse"
                  />
                  ONLINE
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 font-mono text-[13px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-mist">
                <span>PAY-000214 · $20.00</span>
                <span className="text-phosphor">+58.8 kWh</span>
              </div>
              <div className="flex items-center justify-between text-mist">
                <span>PAY-000198 · $10.00</span>
                <span className="text-phosphor">+29.4 kWh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <div className={`${glass} p-4 sm:p-8`}>
          <ProcessAnimation />
          <p className="mt-2 text-center text-xs text-mist">
            One payment event, verified exactly once — watch the duplicate
            bounce — then credited straight to the meter. No 20-digit token.
          </p>
        </div>
        <h2 className="mt-14 font-mono text-[11px] tracking-widest text-volt uppercase">
          How it works
        </h2>
        <p className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
          Three steps. One transaction. Zero double credits.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(([n, title, detail]) => (
            <div key={n} className={`${glass} p-6`}>
              <span className="font-mono text-sm text-credit">{n}</span>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section
        id="features"
        className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16"
      >
        <h2 className="font-mono text-[11px] tracking-widest text-volt uppercase">
          Features
        </h2>
        <p className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
          Built like a national utility app should be.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, detail]) => (
            <div key={title} className={`${glass} p-6`}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {title === "AI energy assistant" && (
                  <span className="rounded bg-volt/15 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-volt uppercase">
                    Phase 3
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-mist">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Technology ─────────────────────────────────────────── */}
      <section
        id="technology"
        className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16"
      >
        <h2 className="font-mono text-[11px] tracking-widest text-volt uppercase">
          Technology
        </h2>
        <p className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
          Engineered in the open.
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-mist">
          Every architectural decision — idempotency, row-level security, the
          registry emulation, the MQTT topic design — is documented in the
          repository and built in reviewable stages.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {stack.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-sm text-mist"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Disclaimer ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className={`${glass} border-volt/25 bg-volt/[0.07] p-6`}>
          <h2 className="font-mono text-[11px] tracking-widest text-volt uppercase">
            Independent demo
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist">
            ZimSmartMeter is an independent technical demonstration. It is not
            affiliated with ZESA or any utility, does not connect to any
            production infrastructure, and uses no proprietary systems or
            branding. All meters, payments and readings are clearly labelled
            synthetic demo data. No real money moves and no real electricity is
            dispensed.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="mt-8 border-t border-white/10">
        <AccentLine />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <Mark size={22} />
            <span className="font-mono text-sm font-medium">ZimSmartMeter</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} className="hover:text-paper">
                {label}
              </a>
            ))}
            <a
              href="https://github.com/nobytechy/ZimSmartMeter"
              className="hover:text-paper"
            >
              GitHub
            </a>
          </div>
          <p className="text-sm text-mist">
            Designed &amp; built by{" "}
            <a
              href="https://nobie.netlify.app"
              className="text-paper underline underline-offset-4 hover:text-volt"
            >
              N.&nbsp;Tebulo
            </a>
          </p>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-8 text-xs text-mist/70">
          © 2026 ZimSmartMeter — an open-source demo project. Not affiliated
          with ZESA.
        </div>
      </footer>
    </div>
  );
}
