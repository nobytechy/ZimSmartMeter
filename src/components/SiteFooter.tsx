import Mark from "./Mark";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Mark size={22} />
            <span className="font-mono text-sm font-medium text-paper">
              ZimSmartMeter
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            An open-source prepaid electricity proof-of-concept for Zimbabwe —
            payments become meter credit automatically.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <span className="font-mono text-[11px] tracking-widest text-mist uppercase">
            Project
          </span>
          <a
            href="https://github.com/nobytechy/ZimSmartMeter"
            className="text-mist transition-colors hover:text-paper"
          >
            Source on GitHub
          </a>
          <a
            href="https://github.com/nobytechy/ZimSmartMeter/blob/main/README.md"
            className="text-mist transition-colors hover:text-paper"
          >
            Architecture &amp; build notes
          </a>
          <a
            href="https://nobie.netlify.app"
            className="text-mist transition-colors hover:text-paper"
          >
            Designer's portfolio
          </a>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <span>
            Designed &amp; built by{" "}
            <a
              href="https://nobie.netlify.app"
              className="font-medium text-paper underline underline-offset-4"
            >
              N.&nbsp;Tebulo
            </a>
          </span>
          <span>
            © 2026 · Independent demonstration · Not affiliated with ZESA ·
            Demo data only
          </span>
        </div>
      </div>
    </footer>
  );
}
