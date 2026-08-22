import { Link, Outlet } from "react-router";

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
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-credit" />
          <span className="font-mono text-sm font-medium tracking-tight">
            ZimSmartMeter
          </span>
        </Link>
        <span className="font-mono text-[11px] tracking-widest text-ink-soft uppercase">
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
