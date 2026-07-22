import { createClient } from "@supabase/supabase-js";

/**
 * 招待リンクを未ログインのまま開いた人に見せるプレビュー。
 *
 * クライアントから直接呼ぶサーバーアクションではなく、サーバーコンポーネントから
 * 呼ぶだけなので "use server" は付けない（付けると定数・型をexportできない）。
 * service_role キーは NEXT_PUBLIC_ 接頭辞が無いためクライアントには渡らない。
 *
 * list_share_tokens の SELECT ポリシーは authenticated 限定のため、
 * 通常クライアントでは未ログイン時にトークン検証すらできない。
 * anon 向けに RLS を開けると非公開リストの露出範囲が広がるので、
 * 「トークンを知っている人にだけ、必要最小限を返す」この経路に閉じ込める。
 */

/** 未ログインに見せる地点数の上限（全件は見せない） */
export const GUEST_PREVIEW_PLACE_LIMIT = 5;

export type GuestPreviewPlace = {
  id: string;
  name: string;
};

export type SharedListPreviewResult =
  | {
      success: true;
      listId: string;
      listName: string;
      ownerName: string;
      permission: "view" | "edit";
      placeCount: number;
      places: GuestPreviewPlace[];
    }
  | {
      success: false;
      reasonKey: string;
    };

function failure(reasonKey: string): SharedListPreviewResult {
  return { success: false, reasonKey };
}

export async function getSharedListPreview(
  token: string
): Promise<SharedListPreviewResult> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return failure("errors.validation.invalidInput");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    // 鍵が無い環境で地点を返してしまわないよう、ここで打ち切る
    return failure("errors.common.serverMisconfigured");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: tokenData, error: tokenError } = await supabase
    .from("list_share_tokens")
    .select(
      "list_id, default_permission, is_active, expires_at, max_uses, current_uses, list_name, owner_name, owner_id"
    )
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return failure("errors.common.notFound");
  }

  if (!tokenData.is_active) {
    return failure("errors.common.forbidden");
  }

  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return failure("errors.common.linkExpired");
  }

  if (
    typeof tokenData.max_uses === "number" &&
    typeof tokenData.current_uses === "number" &&
    tokenData.max_uses > 0 &&
    tokenData.current_uses >= tokenData.max_uses
  ) {
    return failure("errors.common.limitReached");
  }

  // limit を付けても count は絞り込み後の総数が返るため、1回の問い合わせで足りる
  const { data: placeRows, count } = await supabase
    .from("list_places")
    .select("places(id, name)", { count: "exact" })
    .eq("list_id", tokenData.list_id)
    .order("added_at", { ascending: true })
    .limit(GUEST_PREVIEW_PLACE_LIMIT);

  // 埋め込み関連は環境により単体/配列いずれの形にもなり得るため、両方を受ける
  const toPlace = (row: unknown): GuestPreviewPlace | null => {
    const embedded = (row as { places?: unknown })?.places;
    const candidate = Array.isArray(embedded) ? embedded[0] : embedded;
    const { id, name } = (candidate ?? {}) as { id?: string; name?: string };
    return id && name ? { id, name } : null;
  };

  // 住所・座標は未ログインに渡さない。id と name だけに絞る。
  const places: GuestPreviewPlace[] = (placeRows ?? [])
    .map(toPlace)
    .filter((place): place is GuestPreviewPlace => place !== null);

  return {
    success: true,
    listId: tokenData.list_id,
    listName: tokenData.list_name || "",
    ownerName: tokenData.owner_name || "",
    permission: tokenData.default_permission === "edit" ? "edit" : "view",
    placeCount: typeof count === "number" ? count : places.length,
    places,
  };
}
