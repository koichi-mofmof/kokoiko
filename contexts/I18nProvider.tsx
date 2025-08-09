"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Locale = "ja" | "en";

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
    // persist for 1 year
    document.cookie = `lang=${next}; path=/; max-age=31536000`;
    setLocaleState(next);
    // ページによりSSRでメッセージを注入しているため、リロードで確実に反映
    window.location.reload();
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
