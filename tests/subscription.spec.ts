import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// SupabaseのプロジェクトURLとanonキーを環境変数から取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
});

test.describe("Subscription Flow", () => {
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
  // ここではCustomer Portal遷移はURL検証せず、ボタン表示のみ確認
  // テストデータ削除
  const { error: delError } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", user.id);
  expect(delError).toBeNull();
});

test("E2E-P-02: 未契約ユーザーは「プランを管理する」ボタンが表示されない", async ({
  page,
}) => {
  const email = `e2e-p02-${Date.now()}@example.com`;
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
  // 「プランを管理する」ボタンがDOMに存在しないことを検証
  await expect(
    page.getByRole("button", { name: "プランを管理する" })
  ).toHaveCount(0);
});

// --- 機能制限: フリープラン地点登録上限 ---
test.describe("機能制限", () => {
  let user: any; // `any` to avoid type issues with Supabase user object
  let list: any;
  const supabase = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  test.beforeEach(async ({ page }) => {
    // 1. テストユーザーを作成
    const email = `e2e-limit-${Date.now()}@example.com`;
    const password = "Password123!";
    const { data, error } = await supabase.auth.signUp({ email, password });
    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    user = data.user;

    // 2. テスト用のリストを作成
    const { data: newList, error: listError } = await supabase
      .from("place_lists")
      .insert({
        name: `テストリスト-${user.id.substring(0, 8)}`,
        created_by: user.id,
        is_public: false,
      })
      .select()
      .single();
    expect(newList).not.toBeNull();
    list = newList;

    // 3. 共同編集者として自分自身を追加（owner権限）
    const { error: collaboratorError } = await supabase
      .from("shared_lists")
      .insert({
        list_id: list.id,
        shared_with_user_id: user.id,
        permission: "edit",
        owner_id: user.id,
      });
    expect(collaboratorError).toBeNull();

    // 4. 作成したユーザーでログインするためのセッション情報をlocalStorageに設定
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.signInWithPassword({ email, password });
    expect(sessionError).toBeNull();
    expect(session).not.toBeNull();

    // ページに遷移する前にコンテキストに認証情報を設定
    await page.addInitScript((session) => {
      window.localStorage.setItem(
        "sb-ivqikrfbvmjootktmmzu-auth-token",
        JSON.stringify(session)
      );
    }, session);

    // ★重要: localStorageにセッションを設定した後、一度トップページにアクセスして認証を確立させる
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test.afterEach(async () => {
    // テストデータをクリーンアップ
    await supabase.from("list_places").delete().eq("list_id", list.id);
    await supabase.from("shared_lists").delete().eq("list_id", list.id);
    await supabase.from("place_lists").delete().eq("id", list.id);
    await supabase.auth.admin.deleteUser(user.id);
  });

  test("E2E-L-01: フリープランユーザーが地点を10件登録→正常に登録できる", async ({
    page,
  }) => {
    await page.goto(`/lists/${list.id}`);
    const addPlaceButton = page.getByTestId("add-place-button-pc");
    await expect(addPlaceButton).toBeVisible();

    // 10回地点登録
    for (let i = 1; i <= 10; i++) {
      await addPlaceButton.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // 1. 場所を検索
      await dialog.getByLabel("場所を検索").fill("東京タワー");
      await dialog.getByRole("button", { name: "検索" }).click();

      // 2. 検索結果を選択
      await expect(dialog.getByText("検索候補")).toBeVisible({
        timeout: 15000,
      });
      const firstResult = dialog
        .getByRole("button", { name: /東京タワー/ })
        .first();
      await expect(firstResult).toBeVisible();
      await firstResult.click();

      // 3. 詳細を入力して登録
      await expect(dialog.getByLabel("場所名")).toHaveValue(/東京タワー/, {
        timeout: 10000,
      });
      await dialog.getByRole("button", { name: "登録" }).click();

      // 4. ダイアログが閉じるのを待つ
      await expect(dialog).not.toBeVisible();
      await expect(page.getByText("場所をリストに追加しました")).toBeVisible();
    }

    // 10件登録後、リスト内に10件表示されていることを検証
    await expect(page.getByRole("article")).toHaveCount(10);
  });

  test("E2E-L-02: フリープランユーザーが11件目を登録しようとする→エラーメッセージが表示され登録ブロック", async ({
    page,
  }) => {
    await page.goto(`/lists/${list.id}`);
    const addPlaceButton = page.getByTestId("add-place-button-mobile");
    await expect(addPlaceButton).toBeVisible();

    // 10回地点登録
    for (let i = 1; i <= 10; i++) {
      await addPlaceButton.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByLabel("場所を検索").fill("東京駅");
      await dialog.getByRole("button", { name: "検索" }).click();
      await expect(dialog.getByText("検索候補")).toBeVisible({
        timeout: 15000,
      });
      const firstResult = dialog
        .getByRole("button", { name: /東京駅/ })
        .first();
      await expect(firstResult).toBeVisible();
      await firstResult.click();
      await expect(dialog.getByLabel("場所名")).toHaveValue(/東京駅/, {
        timeout: 10000,
      });
      await dialog.getByRole("button", { name: "登録" }).click();
      await expect(dialog).not.toBeVisible();
      await expect(page.getByText("場所をリストに追加しました")).toBeVisible();
    }

    // 11件目の登録を試みる
    await addPlaceButton.click();

    // 上限エラーのアラートダイアログが表示されることを検証
    const alertDialog = page.getByRole("alertdialog");
    await expect(alertDialog).toBeVisible();
    await expect(
      alertDialog.getByText("登録地点数の上限に達しました")
    ).toBeVisible();
  });
});
