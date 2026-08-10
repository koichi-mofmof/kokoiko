import { defaultLocale, supportedLocales, type Locale } from "./index";

/**
 * ロケール付きURLのルーティング規約
 *
 * - 既定ロケール(ja)はプレフィックス無し: `/lists/xxx`
 * - それ以外は先頭にロケール: `/en/lists/xxx`
 *
 * 既存の共有URL（reddit/medium等に掲載済み）を壊さないため "as-needed" 方式を採用する。
 * middlewareでプレフィックスを剥がしてから内部ルートへrewriteするので、
 * app/配下のディレクトリ構成は変更しない。
 */

/** middlewareが解決したロケールをRSCへ渡すためのリクエストヘッダ名 */
export const LOCALE_HEADER = "x-locale";

/** URLプレフィックスを持つロケール（既定ロケールは持たない） */
export const prefixedLocales: readonly Locale[] = supportedLocales.filter(
  (l) => l !== defaultLocale
);

/**
 * パス先頭のロケールプレフィックスを分離する。
 * `/en/lists/1` → `{ locale: "en", pathname: "/lists/1" }`
 * `/lists/1`    → `{ locale: null, pathname: "/lists/1" }`
 */
export function splitLocaleFromPath(pathname: string): {
  locale: Locale | null;
  pathname: string;
} {
  const segments = pathname.split("/");
  // segments[0] は必ず空文字（先頭スラッシュのため）
  const first = segments[1]?.toLowerCase();
  const matched = prefixedLocales.find((l) => l === first);

  if (!matched) return { locale: null, pathname };

  const rest = "/" + segments.slice(2).join("/");
  return { locale: matched, pathname: rest === "//" ? "/" : rest };
}

/**
 * 内部パスにロケールプレフィックスを付与する。
 * 既定ロケールは無変換。外部URL・アンカー・クエリのみの文字列はそのまま返す。
 */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/")) return path;
  if (locale === defaultLocale) return path;

  // 二重付与を防ぐ
  const { locale: existing } = splitLocaleFromPath(path);
  if (existing) return path;

  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * hreflang用の言語別絶対URLを生成する。
 * Next.jsの `alternates.languages` にそのまま渡せる形。
 */
export function buildLanguageAlternates(
  path: string,
  baseUrl?: string
): Record<string, string> {
  const prefix = baseUrl ?? "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const alternates: Record<string, string> = {};

  for (const locale of supportedLocales) {
    alternates[locale] = `${prefix}${localizePath(normalized, locale)}`;
  }
  // 言語が一致しないユーザー向けの既定版
  alternates["x-default"] = `${prefix}${localizePath(
    normalized,
    defaultLocale
  )}`;

  return alternates;
}
