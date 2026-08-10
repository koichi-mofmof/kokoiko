import { buildListMetaDescription, truncate } from "@/lib/seo/list-description";

// 実メッセージと同じ形の簡易t関数
const t = (key: string, params?: Record<string, string | number>) => {
  const templates: Record<string, string> = {
    "meta.list.separator": ", ",
    "meta.list.desc.withRegion":
      "{places} and more — {n} spots in {region} mapped in one place. Copy this list to start planning your own trip.",
    "meta.list.desc.noRegion":
      "{places} and more — {n} spots mapped in one place. Copy this list to start planning your own trip.",
    "listsDetail.placesCount": "{n} places",
  };
  let text = templates[key] ?? key;
  for (const [k, v] of Object.entries(params ?? {})) {
    text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
  }
  return text;
};

describe("buildListMetaDescription", () => {
  it("地点名と地域を含む説明文を作る", () => {
    const description = buildListMetaDescription({
      t,
      listDescription: null,
      placesCount: 10,
      samplePlaceNames: ["Sushi Fujita", "Harukoma", "Endo Sushi"],
      primaryRegion: "Osaka",
    });

    expect(description).toContain("Sushi Fujita, Harukoma, Endo Sushi");
    expect(description).toContain("10 spots in Osaka");
  });

  it("地域が取れない場合は地域なしの文面にする", () => {
    const description = buildListMetaDescription({
      t,
      listDescription: null,
      placesCount: 5,
      samplePlaceNames: ["A", "B"],
      primaryRegion: null,
    });

    expect(description).toContain("5 spots mapped in one place");
    expect(description).not.toContain("undefined");
    expect(description).not.toContain("{region}");
  });

  it("作成者の説明文があれば先頭に置く", () => {
    const description = buildListMetaDescription({
      t,
      listDescription: "My favourite ramen spots",
      placesCount: 3,
      samplePlaceNames: ["Ichiran"],
      primaryRegion: "Tokyo",
    });

    expect(description.startsWith("My favourite ramen spots")).toBe(true);
  });

  it("地点0件のときは件数のみのフォールバックを使う", () => {
    const description = buildListMetaDescription({
      t,
      listDescription: null,
      placesCount: 0,
      samplePlaceNames: [],
      primaryRegion: null,
    });

    expect(description).toBe("0 places");
  });

  it("155文字を超えない", () => {
    const description = buildListMetaDescription({
      t,
      listDescription: "x".repeat(300),
      placesCount: 10,
      samplePlaceNames: ["A", "B", "C"],
      primaryRegion: "Kyoto",
    });

    expect(description.length).toBeLessThanOrEqual(155);
    expect(description.endsWith("…")).toBe(true);
  });
});

describe("truncate", () => {
  it("短い文字列はそのまま返す", () => {
    expect(truncate("hello", 20)).toBe("hello");
  });

  it("連続する空白を1つに畳む", () => {
    expect(truncate("a   b\n c", 20)).toBe("a b c");
  });
});

describe("件数と列挙の整合", () => {
  const tExact = (key: string, params?: Record<string, string | number>) => {
    const templates: Record<string, string> = {
      "meta.list.separator": ", ",
      "meta.list.desc.withRegion":
        "{places} and more — {n} spots in {region} mapped in one place.",
      "meta.list.desc.withRegionExact":
        "{places} — {n} spots in {region} mapped in one place.",
      "meta.list.desc.noRegion": "{places} and more — {n} spots mapped in one place.",
      "meta.list.desc.noRegionExact": "{places} — {n} spots mapped in one place.",
    };
    let text = templates[key] ?? key;
    for (const [k, v] of Object.entries(params ?? {})) {
      text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
    }
    return text;
  };

  it("全件を列挙できているときは「and more」と書かない", () => {
    const description = buildListMetaDescription({
      t: tExact,
      listDescription: null,
      placesCount: 2,
      samplePlaceNames: ["A", "B"],
      primaryRegion: "Osaka",
    });

    expect(description).not.toContain("and more");
    expect(description).toBe("A, B — 2 spots in Osaka mapped in one place.");
  });

  it("列挙しきれていないときは「and more」を書く", () => {
    const description = buildListMetaDescription({
      t: tExact,
      listDescription: null,
      placesCount: 10,
      samplePlaceNames: ["A", "B", "C"],
      primaryRegion: "Osaka",
    });

    expect(description).toContain("and more");
  });
});
