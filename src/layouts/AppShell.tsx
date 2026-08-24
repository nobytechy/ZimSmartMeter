import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import AccentLine from "../components/AccentLine";
import LanguageToggle from "../components/LanguageToggle";
import Mark from "../components/Mark";
import { useOnline } from "../hooks/useOnline";
import { useT } from "../i18n/context";
import { signOut } from "../services/auth";

/**
 * Product shell: a permanent sidebar from `lg` up, a slide-in drawer below.
 * Mobile-first — the drawer is the default and the desktop rail is the
 * enhancement, not the other way round.
 */
const nav = [
  { to: "/app", key: "nav.dashboard" as const, end: true },
  { to: "/app/assistant", key: "nav.askNoby" as const },
  { to: "/app/simulator", key: "nav.simulator" as const, pulse: true },
  { to: "/app/activity", key: "nav.activity" as const },
  { to: "/app/meters/new", key: "dash.connectMeter" as const },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
              isActive
                ? "bg-white/10 font-semibold text-paper"
                : "text-mist hover:bg-white/5 hover:text-paper"
            }`
          }
        >
          {item.pulse && (
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-volt opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-volt" />
            </span>
          )}
          {t(item.key)}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppShell() {
  const online = useOnline();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);

  const t = useT();

  const signOutNow = () => {
    void signOut().then(() => navigate("/login", { replace: true }));
  };

  return (
    <div className="relative min-h-dvh bg-night text-paper">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-credit opacity-15 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-sky opacity-10 blur-3xl" />
      </div>

      {/* ── top bar (all sizes) ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-night/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="rounded-lg border border-white/15 p-2 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-paper" fill="none" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link
            to="/app"
            onClick={() => setDrawer(false)}
            className="flex items-center gap-2.5"
          >
            <Mark size={22} />
            <span className="font-mono text-sm font-medium tracking-tight">
              ZimSmartMeter
            </span>
          </Link>
          <span className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            {!online && (
              <span className="rounded border border-volt/40 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-volt uppercase">
                {t("chrome.offline")}
              </span>
            )}
            <span className="rounded bg-volt px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-widest text-ink uppercase">
              {t("chrome.demo")}
            </span>
          </span>
        </div>
        <AccentLine />
      </header>

      <div className="relative flex">
        {/* ── desktop rail ── */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col justify-between border-r border-white/10 p-4 lg:flex">
          <NavItems />
          <button
            type="button"
            onClick={signOutNow}
            className="rounded-lg px-3 py-2.5 text-left text-sm text-mist hover:bg-white/5 hover:text-paper"
          >
            {t("nav.signOut")}
          </button>
        </aside>

        {/* ── mobile drawer ── */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close menu"
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col justify-between border-r border-white/10 bg-night p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5 px-1 py-2">
                  <Mark size={22} />
                  <span className="font-mono text-sm font-medium">Menu</span>
                </div>
                <NavItems onNavigate={() => setDrawer(false)} />
              </div>
              <button
                type="button"
                onClick={signOutNow}
                className="rounded-lg px-3 py-2.5 text-left text-sm text-mist hover:bg-white/5"
              >
                {t("nav.signOut")}
              </button>
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-5xl px-4 pb-10 lg:px-8">
            <Outlet />
          </div>
          <footer className="border-t border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-5 text-xs leading-relaxed text-mist lg:px-8">
{t("chrome.disclaimer")}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
