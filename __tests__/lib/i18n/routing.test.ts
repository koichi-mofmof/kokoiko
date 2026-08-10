import {
  buildLanguageAlternates,
  localizePath,
  prefixedLocales,
  splitLocaleFromPath,
} from "@/lib/i18n/routing";

describe("splitLocaleFromPath", () => {
  it("プレフィックス付きパスからロケールを分離する", () => {
    expect(splitLocaleFromPath("/en/lists/abc")).toEqual({
      locale: "en",
      pathname: "/lists/abc",
    });
    expect(splitLocaleFromPath("/de/public-lists")).toEqual({
      locale: "de",
      pathname: "/public-lists",
    });
  });

  it("ロケールのみのパスはルートに解決する", () => {
    expect(splitLocaleFromPath("/en")).toEqual({
      locale: "en",
      pathname: "/",
    });
    expect(splitLocaleFromPath("/en/")).toEqual({
      locale: "en",
      pathname: "/",
    });
  });

  it("既定ロケール(ja)はプレフィックスを持たないので分離しない", () => {
    expect(splitLocaleFromPath("/ja/lists/abc")).toEqual({
      locale: null,
      pathname: "/ja/lists/abc",
    });
  });

  it("プレフィックス無しのパスはそのまま返す", () => {
    expect(splitLocaleFromPath("/lists/abc")).toEqual({
      locale: null,
      pathname: "/lists/abc",
    });
    expect(splitLocaleFromPath("/")).toEqual({ locale: null, pathname: "/" });
  });

  it("ロケールに似た先頭セグメントを誤検出しない", () => {
    // 実在しうるIDやパスを巻き込まないこと
    expect(splitLocaleFromPath("/entries/abc").locale).toBeNull();
    expect(splitLocaleFromPath("/design").locale).toBeNull();
    expect(splitLocaleFromPath("/lists/english-food").locale).toBeNull();
  });
});

describe("localizePath", () => {
  it("既定ロケールはプレフィックスを付けない", () => {
    expect(localizePath("/lists/abc", "ja")).toBe("/lists/abc");
    expect(localizePath("/", "ja")).toBe("/");
  });

  it("非既定ロケールはプレフィックスを付ける", () => {
    expect(localizePath("/lists/abc", "en")).toBe("/en/lists/abc");
    expect(localizePath("/", "fr")).toBe("/fr");
  });

  it("二重付与しない", () => {
    expect(localizePath("/en/lists/abc", "en")).toBe("/en/lists/abc");
  });

  it("外部URLやハッシュはそのまま返す", () => {
    expect(localizePath("https://example.com", "en")).toBe(
      "https://example.com"
    );
    expect(localizePath("#section", "en")).toBe("#section");
  });
});

describe("buildLanguageAlternates", () => {
  it("全対応言語 + x-default を返す", () => {
    const alternates = buildLanguageAlternates("/lists/abc");

    expect(alternates).toEqual({
      ja: "/lists/abc",
      en: "/en/lists/abc",
      es: "/es/lists/abc",
      fr: "/fr/lists/abc",
      de: "/de/lists/abc",
      "x-default": "/lists/abc",
    });
  });

  it("baseUrlを渡すと絶対URLになる", () => {
    const alternates = buildLanguageAlternates("/", "https://clippymap.com");

    expect(alternates.ja).toBe("https://clippymap.com/");
    expect(alternates.en).toBe("https://clippymap.com/en");
  });
});

describe("prefixedLocales", () => {
  it("既定ロケールを含まない", () => {
    expect(prefixedLocales).not.toContain("ja");
    expect([...prefixedLocales].sort()).toEqual(["de", "en", "es", "fr"]);
  });
});
