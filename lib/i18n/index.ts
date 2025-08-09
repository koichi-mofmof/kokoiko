import { enUS, ja as jaDateFns } from "date-fns/locale";

export type Locale = "ja" | "en"; // 将来ここに追加するだけで拡張可能

export const supportedLocales: readonly Locale[] = ["ja", "en"] as const;
export const defaultLocale: Locale = "ja";

export function normalizeLocale(raw?: string | null): Locale {
  if (!raw) return defaultLocale;
  const lower = raw.toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("ja")) return "ja";
  return defaultLocale;
}

type Messages = Record<string, string>;

const loaders: Record<Locale, () => Promise<Messages>> = {
  en: async () => (await import("@/messages/en.json")).default,
  ja: async () => (await import("@/messages/ja.json")).default,
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  const loader = loaders[locale] ?? loaders[defaultLocale];
  return loader();
}

export function toOpenGraphLocale(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: "en_US",
    ja: "ja_JP",
  };
  return map[locale] ?? map[defaultLocale];
}

export function getDateFnsLocale(locale: Locale) {
  const map: Record<Locale, LocaleOfDateFns> = {
    en: enUS,
    ja: jaDateFns,
  };
  return map[locale] ?? map[defaultLocale];
}

type LocaleOfDateFns = typeof enUS | typeof jaDateFns;

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
