import { describe, expect, test } from "@jest/globals";
import {
  loginSchema,
  passwordClientSchema,
  signupSchema,
} from "@/lib/validators/auth";

const hasIssue = (
  result: { success: boolean; error?: { issues: { message: string }[] } },
  message: string
) =>
  !result.success &&
  !!result.error?.issues.some((i) => i.message === message);

describe("loginSchema: ログインは複雑性を課さない", () => {
  test("空でないパスワードなら（短くても）通る", () => {
    const r = loginSchema.safeParse({ email: "a@example.com", password: "x" });
    expect(r.success).toBe(true);
  });

  test("空パスワードは required で失敗する", () => {
    const r = loginSchema.safeParse({ email: "a@example.com", password: "" });
    expect(r.success).toBe(false);
    expect(hasIssue(r, "validation.auth.password.required")).toBe(true);
  });

  test("メール形式が不正なら失敗する", () => {
    const r = loginSchema.safeParse({ email: "invalid", password: "x" });
    expect(r.success).toBe(false);
    expect(hasIssue(r, "validation.auth.email.invalid")).toBe(true);
  });
});

describe("signupSchema: 記号は英数字以外すべてを許可する", () => {
  const base = { email: "a@example.com", termsAccepted: true };
  const parse = (pw: string) =>
    signupSchema.safeParse({ ...base, password: pw, confirmPassword: pw });

  test.each([
    "Pass-word1", // ハイフン
    "Pass_word1", // アンダースコア
    "Pass+word1", // プラス
    "Pass=word1", // イコール
    "Passw0rd!", // 従来から許可
    "Pa1!aaaa", // 8文字ちょうど
  ])("記号を含む有効なパスワードは通る: %s", (pw) => {
    expect(parse(pw).success).toBe(true);
  });

  test.each([
    ["記号なし", "Password1"],
    ["大文字なし", "password1!"],
    ["小文字なし", "PASSWORD1!"],
    ["数字なし", "Password!!"],
    ["8文字未満", "Pa1!aa"],
  ])("無効なパスワードは弾く: %s", (_label, pw) => {
    expect(parse(pw).success).toBe(false);
  });

  test("記号なしは ruleStrong メッセージになる", () => {
    const r = parse("Password1");
    expect(hasIssue(r, "validation.auth.password.ruleStrong")).toBe(true);
  });

  test("確認用パスワード不一致は mismatch", () => {
    const r = signupSchema.safeParse({
      ...base,
      password: "Pass-word1",
      confirmPassword: "Other-pass1",
    });
    expect(r.success).toBe(false);
    expect(hasIssue(r, "validation.auth.password.mismatch")).toBe(true);
  });

  test("利用規約未同意は terms.required", () => {
    const r = signupSchema.safeParse({
      email: "a@example.com",
      password: "Pass-word1",
      confirmPassword: "Pass-word1",
      termsAccepted: false,
    });
    expect(r.success).toBe(false);
    expect(hasIssue(r, "validation.auth.terms.required")).toBe(true);
  });
});

describe("passwordClientSchema: 記号拡張と新旧同一チェック", () => {
  test("ハイフンを記号として含む新パスワードは通る", () => {
    const r = passwordClientSchema.safeParse({
      currentPassword: "Old-pass1",
      newPassword: "New-pass1",
    });
    expect(r.success).toBe(true);
  });

  test("新旧が同一なら newMustDiffer", () => {
    const r = passwordClientSchema.safeParse({
      currentPassword: "Same-pass1",
      newPassword: "Same-pass1",
    });
    expect(r.success).toBe(false);
    expect(hasIssue(r, "validation.auth.password.newMustDiffer")).toBe(true);
  });

  test("記号を含まない新パスワードは ruleStrong", () => {
    const r = passwordClientSchema.safeParse({
      currentPassword: "Old-pass1",
      newPassword: "Newpass12",
    });
    expect(r.success).toBe(false);
    expect(hasIssue(r, "validation.auth.password.ruleStrong")).toBe(true);
  });
});
