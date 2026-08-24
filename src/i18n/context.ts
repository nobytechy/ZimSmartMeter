import { createContext, useContext } from "react";
import { dict } from "./dict";
import type { Lang, TKey } from "./dict";

export type I18n = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
};

export const I18nContext = createContext<I18n>({
  lang: "en",
  setLang: () => {},
  t: (key) => dict[key].en,
});

export function useI18n() {
  return useContext(I18nContext);
}

/** Convenience: just the translate function, for components that only read. */
export function useT() {
  return useContext(I18nContext).t;
}
