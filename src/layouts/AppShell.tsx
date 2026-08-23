import { Link, Outlet } from "react-router";
import AccentLine from "../components/AccentLine";
import Mark from "../components/Mark";

/**
 * The product shell: full-width night theme shared with the marketing
 * site — glass header, ambient glow, disclaimer footer. Pages inside
 * get the whole screen (bounded at max-w-6xl for line-length sanity).
 */
export default function AppShell() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-night text-paper">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-credit opacity-15 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-sky opacity-10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-night/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark size={22} />
            <span className="font-mono text-sm font-medium tracking-tight">
              ZimSmartMeter
            </span>
          </Link>
          <span className="rounded bg-volt px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-widest text-ink uppercase">
            demo
          </span>
        </div>
        <AccentLine />
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-5">
        <Outlet />
      </main>

      <footer className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-5 text-xs leading-relaxed text-mist">
          Independent proof-of-concept. Not affiliated with ZESA. All meters
          and payments are simulated demo data.
        </div>
      </footer>
    </div>
  );
}
