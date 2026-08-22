import { Link } from "react-router";
import Mark from "./Mark";
import NationalBand from "./NationalBand";

const links = [
  ["#how", "How it works"],
  ["#features", "Features"],
  ["#stack", "Under the hood"],
  ["https://github.com/nobytechy/ZimSmartMeter", "GitHub"],
] as const;

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-white/10 bg-night/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <Mark size={24} />
            <span className="font-mono text-sm font-medium tracking-tight text-paper">
              ZimSmartMeter
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-mist transition-colors hover:text-paper"
              >
                {label}
              </a>
            ))}
          </nav>

          <Link
            to="/login"
            className="rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-ink active:brightness-95"
          >
            Sign in
          </Link>
        </div>
      </div>
      <NationalBand />
    </header>
  );
}
