import { useCallback, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import AccentLine from "../components/AccentLine";
import LanguageToggle from "../components/LanguageToggle";
import Spinner from "../components/Spinner";
import Mark from "../components/Mark";
import { useOnline } from "../hooks/useOnline";
import { useIdleLogout } from "../hooks/useIdleLogout";
import { useSession } from "../features/auth/sessionContext";
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
  const { session } = useSession();
  const signedIn = Boolean(session);
  const [signingOut, setSigningOut] = useState(false);

  const t = useT();

  const signOutNow = useCallback(() => {
    setSigningOut(true);
    setDrawer(false);
    void signOut().finally(() => {
      setSigningOut(false);
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  // Idle guard runs only for a signed-in session.
  const { warning, secondsLeft, staySignedIn } = useIdleLogout(
    () => {
      if (signedIn) signOutNow();
    },
    { idleMs: 10 * 60_000, graceMs: 60_000 },
  );

  return (
    <div className="relative min-h-dvh bg-night text-paper">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-credit opacity-15 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-sky opacity-10 blur-3xl" />
      </div>

      {/* ── top bar (all sizes) ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-night/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          {signedIn && (
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
          )}
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
        {signedIn && (
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col justify-between border-r border-white/10 p-4 lg:flex">
          <NavItems />
          <button
            type="button"
            onClick={signOutNow}
            className="rounded-lg px-3 py-2.5 text-left text-sm text-mist hover:bg-white/5 hover:text-paper"
          >
            {signingOut && <Spinner className="mr-2" />}
            {t("nav.signOut")}
          </button>
        </aside>
        )}

        {/* ── mobile drawer ── */}
        {signedIn && drawer && (
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
                  <span className="font-mono text-sm font-medium">{t("nav.menu")}</span>
                </div>
                <NavItems onNavigate={() => setDrawer(false)} />
              </div>
              <button
                type="button"
                onClick={signOutNow}
                className="rounded-lg px-3 py-2.5 text-left text-sm text-mist hover:bg-white/5"
              >
                {signingOut && <Spinner className="mr-2" />}
                {t("nav.signOut")}
              </button>
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">
          {signedIn && warning && (
            <div className="mx-auto mt-4 flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 rounded-xl border border-volt/40 bg-volt/10 px-4 py-3 lg:px-8">
              <p className="text-sm text-volt">
                {t("idle.title")}{" "}
                <span className="font-mono">{secondsLeft}s</span>
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={staySignedIn}
                  className="rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-ink active:brightness-95"
                >
                  {t("idle.stay")}
                </button>
                <button
                  type="button"
                  onClick={signOutNow}
                  className="text-sm text-mist underline underline-offset-4"
                >
                  {t("nav.signOut")}
                </button>
              </div>
            </div>
          )}
          <div className="mx-auto w-full max-w-5xl px-4 pb-10 lg:px-8">
            <Outlet />
          </div>
          <footer className="border-t border-white/10">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs leading-relaxed text-mist lg:px-8">
              <span className="max-w-2xl">{t("chrome.disclaimer")}</span>
              <a
                href="https://nobie.netlify.app"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-mono whitespace-nowrap hover:text-volt"
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-volt" />
                {t("chrome.poweredBy")}
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
