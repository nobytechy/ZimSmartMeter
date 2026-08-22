import { Link, Outlet } from "react-router";
import Mark from "../components/Mark";

/**
 * Global frame for every screen: brand header, routed content, and the
 * always-visible disclaimer. Width is capped at `max-w-md` so the app reads
 * as phone-first even on a desktop browser.
 */
export default function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-2">
          <Mark />
          <span className="font-mono text-sm font-medium tracking-tight">
            ZimSmartMeter
          </span>
        </Link>
        <span className="rounded bg-volt px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-widest text-ink uppercase">
          demo
        </span>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line py-5 text-xs leading-relaxed text-ink-soft">
        Independent proof-of-concept. Not affiliated with ZESA. All meters and
        payments are simulated demo data.
      </footer>
    </div>
  );
}
