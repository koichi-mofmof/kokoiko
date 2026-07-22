import de from "@/messages/de.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import ja from "@/messages/ja.json";

const LOCALES: Record<string, Record<string, string>> = { ja, en, fr, de, es };

// ログイン導線と「ホームへ戻る」は既存キー（auth.common.login / notFound.backHome）を再利用する
const REQUIRED_KEYS = [
  "join.guest.invitedBy",
  "join.guest.placeCount",
  "join.guest.remaining",
  "join.guest.cta",
  "join.guest.ctaNote",
  "auth.common.login",
  "notFound.backHome",
];

describe("招待プレビューの文言が5言語すべてに存在する", () => {
  it.each(Object.keys(LOCALES))("%s に全キーがある", (locale) => {
    const messages = LOCALES[locale];
    const missing = REQUIRED_KEYS.filter((key) => !messages[key]?.trim());

    expect(missing).toEqual([]);
  });

  it.each(Object.keys(LOCALES))(
    "%s で補間プレースホルダが保持されている",
    (locale) => {
      const messages = LOCALES[locale];

      expect(messages["join.guest.invitedBy"]).toContain("{name}");
      expect(messages["join.guest.placeCount"]).toContain("{count}");
      expect(messages["join.guest.remaining"]).toContain("{count}");
    }
  );
});
