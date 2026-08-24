import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { languages } from "../i18n/dict";
import type { Lang } from "../i18n/dict";

const short: Record<Lang, string> = {
  en: "EN",
  sn: "SN",
  nd: "ND",
  zh: "中",
};

/**
 * Compact language switcher: a two-character button that opens a native-name
 * list. Small enough for a phone header, obvious enough to find.
 */
export default function LanguageToggle({ dark = true }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs ${
          dark
            ? "border-white/15 text-mist hover:bg-white/5 hover:text-paper"
            : "border-line text-ink-soft hover:bg-paper"
        }`}
      >
        {short[lang]} ▾
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-night shadow-lg shadow-black/40"
        >
          {(Object.keys(languages) as Lang[]).map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === lang}
                onClick={() => {
                  setLang(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5 ${
                  l === lang ? "text-volt" : "text-paper"
                }`}
              >
                {languages[l]}
                <span className="font-mono text-[11px] text-mist">
                  {short[l]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
