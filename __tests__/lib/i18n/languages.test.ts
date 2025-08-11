import { describe, expect, test } from "@jest/globals";
import {
  normalizeLocale,
  toOpenGraphLocale,
  supportedLocales,
  loadMessages,
  type Locale,
} from "@/lib/i18n";

describe("i18n language expansion es/fr/de", () => {
  test("normalizeLocale maps language tags to supported locales", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("ja-JP")).toBe("ja");
    expect(normalizeLocale("es-ES")).toBe("es");
    expect(normalizeLocale("fr-FR")).toBe("fr");
    expect(normalizeLocale("de-DE")).toBe("de");
    expect(normalizeLocale("es" as any)).toBe("es");
    expect(normalizeLocale("fr" as any)).toBe("fr");
    expect(normalizeLocale("de" as any)).toBe("de");
  });

  test("toOpenGraphLocale returns expected tags", () => {
    expect(toOpenGraphLocale("en")).toBe("en_US");
    expect(toOpenGraphLocale("ja")).toBe("ja_JP");
    expect(toOpenGraphLocale("es")).toBe("es_ES");
    expect(toOpenGraphLocale("fr")).toBe("fr_FR");
    expect(toOpenGraphLocale("de")).toBe("de_DE");
  });

  test("messages include basic language labels across locales", async () => {
    const requiredKeys = [
      "lang.japanese",
      "lang.english",
      "lang.spanish",
      "lang.french",
      "lang.german",
    ];
    for (const loc of supportedLocales as Locale[]) {
      const msgs = await loadMessages(loc);
      for (const key of requiredKeys) {
        expect(msgs[key]).toBeTruthy();
      }
    }
  });

  test("fallback merge ensures common keys are available", async () => {
    // app.name は全ロケールで取得できる（足りない場合は英語からフォールバック）
    for (const loc of supportedLocales as Locale[]) {
      const msgs = await loadMessages(loc);
      expect(msgs["app.name"]).toBe("ClippyMap");
      expect(typeof msgs["meta.description"]).toBe("string");
    }
  });
});
