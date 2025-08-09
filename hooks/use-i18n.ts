"use client";

import { useI18nContext } from "@/contexts/I18nProvider";

export function useI18n() {
  const { t, locale, setLocale } = useI18nContext();
  return { t, locale, setLocale };
}
