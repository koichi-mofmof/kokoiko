import {
  enUS,
  ja as jaDateFns,
  es as esDateFns,
  fr as frDateFns,
  de as deDateFns,
} from "date-fns/locale";

export type Locale = "ja" | "en" | "es" | "fr" | "de"; // 将来ここに追加するだけで拡張可能

export const supportedLocales: readonly Locale[] = [
  "ja",
  "en",
  "es",
  "fr",
  "de",
] as const;
export const defaultLocale: Locale = "ja";

export function normalizeLocale(raw?: string | null): Locale {
  if (!raw) return defaultLocale;
  const lower = raw.toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("de")) return "de";
  return defaultLocale;
}

type Messages = Record<string, string>;

const loaders: Record<Locale, () => Promise<Messages>> = {
  en: async () => (await import("@/messages/en.json")).default,
  ja: async () => (await import("@/messages/ja.json")).default,
  es: async () => (await import("@/messages/es.json")).default,
  fr: async () => (await import("@/messages/fr.json")).default,
  de: async () => (await import("@/messages/de.json")).default,
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  // フォールバック戦略: ja/en 以外は英語をベースにマージ
  const fallbackBase: Record<Locale, Locale> = {
    ja: "ja",
    en: "en",
    es: "en",
    fr: "en",
    de: "en",
  } as const;

  const baseLocale = fallbackBase[locale] ?? defaultLocale;
  const baseMessages = await loaders[baseLocale]();
  if (locale === baseLocale) return baseMessages;
  const currentMessages = await loaders[locale]();
  return { ...baseMessages, ...currentMessages };
}

export function toOpenGraphLocale(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: "en_US",
    ja: "ja_JP",
    es: "es_ES",
    fr: "fr_FR",
    de: "de_DE",
  };
  return map[locale] ?? map[defaultLocale];
}

export function getDateFnsLocale(locale: Locale) {
  const map: Record<Locale, LocaleOfDateFns> = {
    en: enUS,
    ja: jaDateFns,
    es: esDateFns,
    fr: frDateFns,
    de: deDateFns,
  };
  return map[locale] ?? map[defaultLocale];
}

type LocaleOfDateFns =
  | typeof enUS
  | typeof jaDateFns
  | typeof esDateFns
  | typeof frDateFns
  | typeof deDateFns;

export function createServerT(messages: Record<string, string>) {
  return (key: string, params?: Record<string, string | number>) => {
    let text = messages[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
      }
    }
    return text;
  };
}
