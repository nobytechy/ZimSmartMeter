import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { I18nContext } from "./context";
import { dict, languages } from "./dict";
import type { Lang, TKey } from "./dict";

const STORE_KEY = "zsm.lang";

function initialLang(): Lang {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved && saved in languages) return saved as Lang;
  // Respect the device: a Shona/Ndebele/Chinese phone opens in kind.
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("sn")) return "sn";
  if (nav.startsWith("nd")) return "nd";
  if (nav.startsWith("zh")) return "zh";
  return "en";
}

/**
 * Language state for the whole app. English is the fallback for any key a
 * translation hasn't reached yet, so partial coverage degrades gracefully
 * instead of showing raw keys.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: TKey) => {
      const entry = dict[key];
      return entry[lang] || entry.en;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
