"use server";

import { revalidateListCache } from "@/lib/cloudflare/cdn-cache";
import { createClient } from "@/lib/supabase/server";
import { getTotalAvailablePlaces } from "@/lib/utils/subscription-utils";
import {
  copyPlacesSchema,
  type CopyPlacesInput,
} from "@/lib/validators/template-copy";
import { revalidatePath } from "next/cache";

export type PlaceAvailability = {
  totalLimit: number;
  usedPlaces: number;
  remainingPlaces: number;
  sources: Array<{
    type: "free" | "subscription" | "one_time_small" | "one_time_regular";
    limit: number;
    used: number;
  }>;
};

export type CopyPlacesResult = {
  success: boolean;
  errorKey?: string;
  error?: string;
  /** 実際にコピーできた地点数 */
  copiedCount?: number;
  /** コピー先に既に存在していたためスキップした数 */
  skippedDuplicates?: number;
  /** コピー先リストID（新規作成時は新しいID） */
  targetListId?: string;
  /** 上限超過でコピーを実行しなかった場合 true（UIで選び直し/アップグレード導線を表示） */
  limitReached?: boolean;
  /** 残り追加可能数（limitReached 時にUIで表示） */
  remainingPlaces?: number;
  /** ユーザーが追加しようとした件数（重複除外後。limitReached 時にUIで表示） */
  requestedCount?: number;
  placeAvailability?: PlaceAvailability;
};

// list_places + places + tags を取り出すための行型
type SourcePlaceRow = {
  place_id: string;
  places: {
    google_place_id: string | null;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    country_code: string | null;
    country_name: string | null;
    admin_area_level_1: string | null;
    region_hierarchy: unknown | null;
  } | null;
  list_place_tags: { tags: { name: string } | null }[];
};

/**
 * 公開リストから選択した地点を、自分のリスト（新規 or 既存）へコピーする。
 *
 * 設計上の安全策:
 * - コピー元の地点データはクライアントを信頼せず、サーバが公開リストから再取得する
 *   （places は google_place_id 共有のため、誤った値で ON CONFLICT 上書きされるのを防ぐ）。
 * - タグは tag_id を流用せず、既存の register_place_to_list RPC を再利用してコピー先
 *   ユーザーのタグとして名前から再生成する（tags はユーザー単位所有のため）。
 * - 地点制限/クレジット会計は稼働中の経路（getTotalAvailablePlaces, user_id 基準）に合わせる。
 * - コメント・ランキング・訪問ステータスはコピーしない（要件通り「未訪問」で登録）。
 */
export async function copyPlacesToList(
  input: CopyPlacesInput
): Promise<CopyPlacesResult> {
  const supabase = await createClient();

  // 1. 認証
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      errorKey: "errors.common.unauthorized",
      error: "ログインが必要です。",
    };
  }

  // 2. 入力バリデーション
  const validation = copyPlacesSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      errorKey:
        validation.error.errors[0]?.message ||
        "errors.validation.invalidInput",
      error: "入力データに誤りがあります。",
    };
  }
  const { sourceListId, placeIds, target } = validation.data;

  try {
    // 3. コピー元が公開リストか検証（公開リストのみコピー可）
    const { data: sourceList, error: sourceError } = await supabase
      .from("place_lists")
      .select("id, is_public")
      .eq("id", sourceListId)
      .single();

    if (sourceError || !sourceList || !sourceList.is_public) {
      return {
        success: false,
        errorKey: "templateCopy.errors.permissionDenied",
        error: "このリストはコピーできません。",
      };
    }

    // 4. コピー元地点をDBから再取得（選択IDかつ公開リストに属するもののみ）
    //    クライアントを信頼せず、公開リストから権威データを取得する。
    const { data: sourceRowsRaw, error: fetchError } = await supabase
      .from("list_places")
      .select(
        `
        place_id,
        places (
          google_place_id,
          name,
          address,
          latitude,
          longitude,
          country_code,
          country_name,
          admin_area_level_1,
          region_hierarchy
        ),
        list_place_tags ( tags ( name ) )
      `
      )
      .eq("list_id", sourceListId)
      .in("place_id", placeIds);

    if (fetchError) {
      console.error("コピー元地点の取得エラー:", fetchError);
      return {
        success: false,
        errorKey: "templateCopy.errors.copyFailed",
        error: "コピー元の地点取得に失敗しました。",
      };
    }

    const sourceRows = (sourceRowsRaw || []) as unknown as SourcePlaceRow[];
    if (sourceRows.length === 0) {
      return {
        success: false,
        errorKey: "templateCopy.errors.noSelection",
        error: "コピー対象の地点がありません。",
      };
    }

    // 5. コピー先のコンテキストを準備（この時点では一切ミューテーションしない）
    //    - 既存リスト: 所有者本人か検証し、既存地点を取得して重複判定に使う
    //    - 新規リスト: 重複なし（作成は上限チェック通過後に行う）
    let existingTargetListId: string | undefined;
    const existingSet = new Set<string>();
    if (target.type === "existing") {
      const { data: targetList, error: targetError } = await supabase
        .from("place_lists")
        .select("id, created_by")
        .eq("id", target.listId)
        .single();
      if (targetError || !targetList || targetList.created_by !== user.id) {
        return {
          success: false,
          errorKey: "templateCopy.errors.permissionDenied",
          error: "このリストへの追加権限がありません。",
        };
      }
      existingTargetListId = targetList.id;

      const { data: existingRows } = await supabase
        .from("list_places")
        .select("place_id")
        .eq("list_id", existingTargetListId);
      for (const r of existingRows || []) {
        existingSet.add((r as { place_id: string }).place_id);
      }
    }

    // 6. 重複を除外した「実際に追加される候補」を確定
    const candidates = sourceRows.filter(
      (row) => row.places && !existingSet.has(row.place_id)
    );
    const skippedDuplicates = sourceRows.length - candidates.length;

    // 7. 地点数上限の判定（ミューテーション前に実施）。
    //    上限を超える場合はコピーせず、残数を返して選び直し/アップグレードを促す。
    const availability = await getTotalAvailablePlaces(supabase, user.id);
    const isUnlimited = availability.remainingPlaces === Infinity;

    if (!isUnlimited && candidates.length > availability.remainingPlaces) {
      return {
        success: false,
        errorKey:
          availability.remainingPlaces <= 0
            ? "templateCopy.limit.full"
            : "templateCopy.limit.exceeded",
        error: "地点数の上限に達しています。",
        limitReached: true,
        copiedCount: 0,
        skippedDuplicates,
        remainingPlaces: availability.remainingPlaces,
        requestedCount: candidates.length,
        placeAvailability: availability,
      };
    }

    // 8. ここで初めてコピー先リストを確定（新規なら作成）
    let targetListId: string;
    if (target.type === "new") {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "create_place_list",
        {
          p_name: target.name,
          p_description: target.description ?? "",
          p_is_public: target.isPublic,
          p_created_by: user.id,
        }
      );
      if (rpcError || !rpcData) {
        console.error("コピー先リスト作成エラー(RPC):", rpcError);
        return {
          success: false,
          errorKey: "errors.common.insertFailed",
          error: "コピー先リストの作成に失敗しました。",
        };
      }
      // create_place_list は id を返す（オブジェクト or 文字列のいずれにも対応）
      targetListId = (rpcData as { id?: string }).id ?? (rpcData as string);
    } else {
      targetListId = existingTargetListId!;
    }

    // 9. 各地点を既存RPC（register_place_to_list）でコピー
    let copiedCount = 0;
    for (const row of candidates) {
      const p = row.places!;
      const tagNames = (row.list_place_tags || [])
        .map((lpt) => lpt.tags?.name)
        .filter((name): name is string => !!name && name.trim() !== "");

      const { error: rpcError } = await supabase.rpc("register_place_to_list", {
        google_place_id_input: p.google_place_id ?? row.place_id,
        place_name_input: p.name,
        list_id_input: targetListId,
        user_id_input: user.id,
        place_address_input: p.address ?? undefined,
        place_latitude_input: p.latitude ?? undefined,
        place_longitude_input: p.longitude ?? undefined,
        tag_names_input: tagNames,
        user_comment_input: undefined,
        visited_status_input: "not_visited",
        country_code_input: p.country_code ?? undefined,
        country_name_input: p.country_name ?? undefined,
        admin_area_level_1_input: p.admin_area_level_1 ?? undefined,
        region_hierarchy_input: p.region_hierarchy ?? undefined,
      });

      if (rpcError) {
        // 1件の失敗で全体を止めず、コピーできた分は活かす
        console.error("地点コピー中のRPCエラー:", rpcError);
        continue;
      }
      copiedCount++;
    }

    // 10. キャッシュ無効化
    revalidatePath(`/lists/${targetListId}`);
    revalidatePath("/lists");
    await revalidateListCache(targetListId);

    return {
      success: true,
      copiedCount,
      skippedDuplicates,
      targetListId,
    };
  } catch (error) {
    console.error("Unexpected error in copyPlacesToList:", error);
    return {
      success: false,
      errorKey: "templateCopy.errors.copyFailed",
      error: "コピー処理中に予期せぬエラーが発生しました。",
    };
  }
}

/**
 * コピー先として選択できる「自分が所有するリスト」一覧を取得（軽量）。
 */
export async function getOwnedListsForCopy(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("place_lists")
    .select("id, name")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("自分のリスト一覧取得エラー:", error);
    return [];
  }
  return (data || []) as { id: string; name: string }[];
}
