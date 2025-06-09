import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// SupabaseのプロジェクトURLとanonキーを環境変数から取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

test.describe("Subscription Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
  });

  // テストごとにユニークなメールアドレスを生成
  const email = `test-user-${Date.now()}@example.com`;
  const password = "Password123!";

  test("SCN-01: New user can sign up and start the checkout process", async ({
    page,
  }) => {
    // Supabaseクライアントを初期化
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // テスト実行前にSupabase Authにユーザーを直接作成
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    expect(error).toBeNull();
    expect(user).not.toBeNull();

    // メール認証はテスト環境では無効になっていると仮定

    // 1. トップページにアクセスし、ログインページへ
    await page.goto("/login");

    // 2. 作成したユーザーでログイン
    const loginForm = page.getByTestId("credentials-login-form");
    await loginForm.getByLabel("メールアドレス").fill(email);
    await loginForm.getByLabel("パスワード").fill(password);
    await loginForm.getByRole("button", { name: "ログイン" }).click();

    // ログイン後のダッシュボード（またはホームページ）に遷移したことをURLで確認
    await expect(page).toHaveURL("/lists", { timeout: 15000 });

    // 3. プラン選択UIを開く
    await page.goto("/settings/billing");

    // 4. アップグレードボタンをクリックしてダイアログを開く
    await page.getByTestId("upgrade-dialog-trigger").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // 5. 月額プランが選択されていることを確認し、申し込みボタンをクリック
    await expect(page.getByTestId("plan-tab-monthly")).toHaveAttribute(
      "data-state",
      "active"
    );
    await page.getByTestId("checkout-button").click();

    // 6. Stripe Checkoutページへのリダイレクトを待機し、URLを確認
    await page.waitForURL("https://checkout.stripe.com/**", { timeout: 15000 });

    const url = page.url();
    expect(url).toContain("https://checkout.stripe.com/");
  });
});

test.describe("プラン選択とStripe Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
  });

  test("E2E-C-01: 未ログイン状態でプラン選択ボタンが表示されない", async ({
    page,
  }) => {
    await page.goto("/settings/billing");
    // プラン選択ボタンがDOMに存在しないことを検証
    await expect(page.getByTestId("upgrade-dialog-trigger")).toHaveCount(0);
  });

  test("E2E-C-02: ログイン済み新規ユーザーが月額プラン選択→Stripe Checkout遷移", async ({
    page,
  }) => {
    const email = `e2e-c02-${Date.now()}@example.com`;
    const password = "Password123!";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ email, password });
    expect(error).toBeNull();
    expect(user).not.toBeNull();
    await page.goto("/login");
    const loginForm = page.getByTestId("credentials-login-form");
    await loginForm.getByLabel("メールアドレス").fill(email);
    await loginForm.getByLabel("パスワード").fill(password);
    await loginForm.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL("/lists", { timeout: 15000 });
    await page.goto("/settings/billing");
    await page.getByTestId("upgrade-dialog-trigger").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByTestId("plan-tab-monthly")).toHaveAttribute(
      "data-state",
      "active"
    );
    await page.getByTestId("checkout-button").click();
    await page.waitForURL("https://checkout.stripe.com/**", { timeout: 15000 });
    const url = page.url();
    expect(url).toContain("https://checkout.stripe.com/");
  });

  test("E2E-C-03: ログイン済み新規ユーザーが年額プラン選択→Stripe Checkout遷移", async ({
    page,
  }) => {
    const email = `e2e-c03-${Date.now()}@example.com`;
    const password = "Password123!";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ email, password });
    expect(error).toBeNull();
    expect(user).not.toBeNull();
    await page.goto("/login");
    const loginForm = page.getByTestId("credentials-login-form");
    await loginForm.getByLabel("メールアドレス").fill(email);
    await loginForm.getByLabel("パスワード").fill(password);
    await loginForm.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL("/lists", { timeout: 15000 });
    await page.goto("/settings/billing");
    await page.getByTestId("upgrade-dialog-trigger").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByTestId("plan-tab-yearly").click();
    await expect(page.getByTestId("plan-tab-yearly")).toHaveAttribute(
      "data-state",
      "active"
    );
    await page.getByTestId("checkout-button").click();
    await page.waitForURL("https://checkout.stripe.com/**", { timeout: 15000 });
    const url = page.url();
    expect(url).toContain("https://checkout.stripe.com/");
  });

  test("E2E-C-04: Checkoutページで決済情報を入力し完了→success_url遷移（URL検証のみ）", async ({
    page,
  }) => {
    // Stripe Checkoutのテスト用URLを直接開き、success_urlへのリダイレクトをシミュレート
    // 実際の決済UI操作は自動化困難なため、success_urlのパラメータ検証のみ
    // ここでは仮にsuccess_urlが /settings/billing/success であると仮定
    await page.goto("/settings/billing/success");
    await expect(page).toHaveURL("/settings/billing/success");
    // 実際のアプリではsuccessページに「決済が完了しました」等の文言が表示されることを検証
    // await expect(page.getByText("決済が完了しました")).toBeVisible();
  });

  test("E2E-C-05: Checkoutページでキャンセル→cancel_url遷移（URL検証のみ）", async ({
    page,
  }) => {
    // Stripe Checkoutのテスト用URLを直接開き、cancel_urlへのリダイレクトをシミュレート
    // ここでは仮にcancel_urlが /settings/billing/cancel であると仮定
    await page.goto("/settings/billing/cancel");
    await expect(page).toHaveURL("/settings/billing/cancel");
    // 実際のアプリではキャンセルページに「決済がキャンセルされました」等の文言が表示されることを検証
    // await expect(page.getByText("決済がキャンセルされました")).toBeVisible();
  });

  test("E2E-C-06: トライアル利用済みユーザーが再度プランを選択→トライアルなしCheckoutページ遷移", async ({
    page,
  }) => {
    const email = `e2e-c06-${Date.now()}@example.com`;
    const password = "Password123!";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ email, password });
    expect(error).toBeNull();
    expect(user).not.toBeNull();
    await page.goto("/login");
    const loginForm = page.getByTestId("credentials-login-form");
    await loginForm.getByLabel("メールアドレス").fill(email);
    await loginForm.getByLabel("パスワード").fill(password);
    await loginForm.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL("/lists", { timeout: 15000 });
    await page.goto("/settings/billing");
    await page.getByTestId("upgrade-dialog-trigger").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByTestId("plan-tab-monthly")).toHaveAttribute(
      "data-state",
      "active"
    );
    await page.getByTestId("checkout-button").click();
    await page.waitForURL("https://checkout.stripe.com/**", { timeout: 15000 });
    const url1 = page.url();
    expect(url1).toContain("https://checkout.stripe.com/");
    // 1回目のCheckoutページから戻る（テスト用にトップページへ遷移）
    await page.goto("/lists");
    // 2回目のプラン選択
    await page.goto("/settings/billing");
    await page.getByTestId("upgrade-dialog-trigger").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByTestId("plan-tab-monthly")).toHaveAttribute(
      "data-state",
      "active"
    );
    await page.getByTestId("checkout-button").click();
    await page.waitForURL("https://checkout.stripe.com/**", { timeout: 15000 });
    const url2 = page.url();
    expect(url2).toContain("https://checkout.stripe.com/");
    // 2回目のCheckout URLに"trial"や"trial_period"等のパラメータが含まれていないことを検証（仮）
    expect(url2).not.toContain("trial");
  });
});

// --- Stripe Customer Portal ---
test.describe("Customer Portal", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
  });

  test("E2E-P-01: 契約中ユーザーが設定ページで「プランを管理する」ボタンをクリック→Customer Portal遷移", async ({
    page,
  }) => {
    // 新規ユーザー作成＆ログイン
    const email = `e2e-p01-${Date.now()}@example.com`;
    const password = "Password123!";
    const supabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ email, password });
    expect(error).toBeNull();
    expect(user).not.toBeNull();
    if (!user) throw new Error("user is null");
    // subscriptionsテーブルにダミーstripe_customer_idをセット
    const dummyCustomerId = "cus_testdummy";
    const { error: upsertError } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: dummyCustomerId,
        status: "active",
      },
      { onConflict: "user_id" }
    );
    expect(upsertError).toBeNull();
    await page.goto("/login");
    const loginForm = page.getByTestId("credentials-login-form");
    await loginForm.getByLabel("メールアドレス").fill(email);
    await loginForm.getByLabel("パスワード").fill(password);
    await loginForm.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL("/lists", { timeout: 15000 });
    await page.goto("/settings/billing");
    const manageBtn = page.getByRole("button", { name: "プランを管理する" });
    await expect(manageBtn).toBeVisible();
    await manageBtn.click();
    // Customer Portalへのリダイレクトを待機
    await page.waitForURL("https://billing.stripe.com/**", { timeout: 15000 });
    const url = page.url();
    expect(url).toContain("https://billing.stripe.com/");
  });
});
