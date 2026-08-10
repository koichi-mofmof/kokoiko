import { cookies, headers } from "next/headers";

import {
  createServerT,
  loadMessages,
  normalizeLocale,
  type Locale,
} from "./index";
import {
  buildLanguageAlternates,
  localizePath,
  LOCALE_HEADER,
} from "./routing";

/**
 * サーバー側のロケール解決。
 *
 * 優先順位:
 *  1. URLプレフィックス（middlewareが `x-locale` ヘッダに載せる） … 検索エンジンにも効く唯一の手段
 *  2. `lang` クッキー（プレフィックス無しURLでの継続利用）
 *  3. 既定ロケール
 *
 * クローラーはクッキーを持たないため、1が無いと必ず既定ロケール(ja)に落ちる。
 * これが「Googlebotに日本語が配信される」問題の原因だったので、
 * ロケール解決は必ずこの関数を経由させること。
 */
export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromPath = headerStore.get(LOCALE_HEADER);
  if (fromPath) return normalizeLocale(fromPath);

  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get("lang")?.value);
}

/** ロケールと翻訳関数をまとめて取得する（generateMetadata用の定型処理） */
export async function getServerI18n(): Promise<{
  locale: Locale;
  t: ReturnType<typeof createServerT>;
  messages: Record<string, string>;
}> {
  const locale = await getRequestLocale();
  const messages = (await loadMessages(locale)) as Record<string, string>;
  return { locale, t: createServerT(messages), messages };
}

/**
 * canonical と hreflang をまとめて生成する。
 *
 * canonical は各言語版が自分自身を指す（言語版同士は重複コンテンツではない）。
 * hreflang で相互参照させることで、Googleに「同一ページの言語違い」と伝える。
 */
export async function buildAlternates(path: string): Promise<{
  canonical: string;
  languages: Record<string, string>;
}> {
  const locale = await getRequestLocale();

  return {
    canonical: localizePath(path, locale),
    languages: buildLanguageAlternates(path),
  };
}
