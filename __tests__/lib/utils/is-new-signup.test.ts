import { isNewSignup } from "@/lib/utils/is-new-signup";

describe("isNewSignup", () => {
  it("初回サインイン（登録直後）は新規とみなす", () => {
    // Google OAuth の実データでは created_at と last_sign_in_at が 0.3 秒ほど差で並ぶ
    expect(
      isNewSignup({
        created_at: "2026-07-20T12:14:35.300695Z",
        last_sign_in_at: "2026-07-20T12:14:35.595726Z",
      })
    ).toBe(true);
  });

  it("後日の再ログインは新規とみなさない", () => {
    expect(
      isNewSignup({
        created_at: "2026-07-01T00:00:00Z",
        last_sign_in_at: "2026-07-20T12:14:35Z",
      })
    ).toBe(false);
  });

  it("同日でも数分空いていれば再ログインとみなす", () => {
    expect(
      isNewSignup({
        created_at: "2026-07-20T12:00:00Z",
        last_sign_in_at: "2026-07-20T12:10:00Z",
      })
    ).toBe(false);
  });

  it("last_sign_in_at が無ければ新規とみなす", () => {
    expect(
      isNewSignup({ created_at: "2026-07-20T12:14:35Z", last_sign_in_at: null })
    ).toBe(true);
  });

  it("判定材料が無い場合は新規とみなさない（登録数を水増ししない）", () => {
    expect(isNewSignup({ created_at: null, last_sign_in_at: null })).toBe(false);
    expect(isNewSignup(undefined)).toBe(false);
  });

  it("日付が壊れていても例外を投げない", () => {
    expect(
      isNewSignup({ created_at: "not-a-date", last_sign_in_at: "also-bad" })
    ).toBe(false);
  });
});
