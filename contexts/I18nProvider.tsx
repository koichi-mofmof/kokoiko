"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { Locale } from "@/lib/i18n";
import { localizePath, splitLocaleFromPath } from "@/lib/i18n/routing";

const stripLocaleFromPathname = (pathname: string) =>
  splitLocaleFromPath(pathname).pathname;

type Messages = Record<string, string>;

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({
  initialLocale,
  messages,
  children,
}: {
  initialLocale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [msgs, setMsgs] = useState<Messages>(messages);

  const setLocale = useCallback((next: Locale) => {
    // persist for 1 year（プレフィックス無しURLへ来たときのリダイレクト判断に使う）
    document.cookie = `lang=${next}; path=/; max-age=31536000`;
    setLocaleState(next);

    // 言語はURLで決まるので、同じページの対象言語版URLへ遷移する。
    // （クッキーだけ書き換えてreloadすると、URLと表示言語が食い違う）
    const { pathname, search, hash } = window.location;
    const currentPath = stripLocaleFromPathname(pathname);
    window.location.href = `${localizePath(
      currentPath,
      next
    )}${search}${hash}`;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text = msgs[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
        }
      }
      return text;
    },
    [msgs]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18nContext must be used within I18nProvider");
  return ctx;
}
