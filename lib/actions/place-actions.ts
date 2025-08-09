"use server";

import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";
import { getActiveSubscription } from "@/lib/dal/subscriptions";
import { createClient } from "@/lib/supabase/server";
import { getRegisteredPlacesCountTotal } from "@/lib/utils/subscription-utils";
import {
  AddCommentInput,
  AddCommentSchema,
  UpdateCommentInput,
  UpdateCommentSchema,
} from "@/lib/validators/comment";
import {
  DeletePlaceSchema,
  PlaceToRegisterSchema,
  UpdatePlaceDetailsSchema,
} from "@/lib/validators/place";
import { ListPlaceComment } from "@/types";
import { revalidateListCache } from "@/lib/cloudflare/cdn-cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type PlaceToRegisterType = z.infer<typeof PlaceToRegisterSchema>;

export type RegisterPlaceResult = {
  success: boolean;
  message?: string;
  successKey?: string;
  listPlaceId?: string; // 作成されたlist_placesレコードのIDなど、必要に応じて
  error?: string; // エラーメッセージ用
  errorKey?: string; // i18n用エラーキー
  fieldErrors?: {
    // フィールドごとのエラーメッセージ
    [key in keyof PlaceToRegisterType]?: string[];
  };
};

export async function registerPlaceToListAction(
  prevState: RegisterPlaceResult,
  data: PlaceToRegisterType
): Promise<RegisterPlaceResult> {
  const supabase = await createClient();

  // 1. ユーザー認証の確認
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      errorKey: "errors.common.unauthorized",
      error: "認証が必要です。",
    };
  }

  // ★追加: サブスクリプション情報取得＆累計の登録数チェック
  const sub = await getActiveSubscription(user.id);
  const isPremium =
    sub && (sub.status === "active" || sub.status === "trialing");
  const maxPlaces = isPremium
    ? SUBSCRIPTION_LIMITS.premium.MAX_PLACES_TOTAL
    : SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL;
  if (!isPremium) {
    // 累計登録済み地点数をカウント（共通ユーティリティ利用）
    const count = await getRegisteredPlacesCountTotal(supabase, user.id);
    if (maxPlaces !== null && count >= maxPlaces) {
      return {
        success: false,
        errorKey: "places.limitReached.freePlan",
        error:
          "フリープランの地点登録上限に達しています。プレミアムプランをご検討ください。",
      };
    }
  }

  // 2. 入力データのバリデーション
  const validationResult = PlaceToRegisterSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      errorKey: "errors.validation.invalidInput",
      error: "入力データに誤りがあります。",
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  const {
    placeId: googlePlaceId, // Google Place IDとして扱う
    name,
    address,
    latitude,
    longitude,
    tags,
    memo,
    listId,
    visited_status, // ★追加
    countryCode,
    countryName,
    adminAreaLevel1,
    regionHierarchy,
  } = validationResult.data;

  // ★追加: 住所から郵便番号を除去
  const cleanedAddress = address?.replace(/(〒?\s*\d{3}-?\d{4}\s*)/, "").trim();

  try {
    // 3. 重複チェック (新しいステップ)
    // list_places テーブルに place_id と list_id の組み合わせが既に存在するか確認
    const { data: existingListPlace, error: listPlaceError } = await supabase
      .from("list_places")
      .select("id")
      .eq("list_id", listId)
      .eq("place_id", googlePlaceId)
      .maybeSingle();

    if (listPlaceError) {
      console.error("Error fetching existing list_place:", listPlaceError);
      return {
        success: false,
        errorKey: "place.errors.checkExistingFailed",
        error: "リスト内の場所の確認中にエラーが発生しました。",
      };
    }

    if (existingListPlace) {
      return {
        success: false,
        errorKey: "place.errors.alreadyInList",
        error: "この場所は既にこのリストに登録されています。",
      };
    }

    // 4. RPC関数の呼び出し (以前のステップ3)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "register_place_to_list",
      {
        google_place_id_input: googlePlaceId,
        place_name_input: name,
        list_id_input: listId,
        user_id_input: user.id, // 認証ユーザーのIDを渡す
        place_address_input: cleanedAddress, // ★修正: 郵便番号除去済み住所を使用
        place_latitude_input: latitude,
        place_longitude_input: longitude,
        tag_names_input: tags,
        user_comment_input: memo,
        visited_status_input: visited_status, // ★追加
        // 階層地域情報の追加
        country_code_input: countryCode,
        country_name_input: countryName,
        admin_area_level_1_input: adminAreaLevel1,
        region_hierarchy_input: regionHierarchy,
      }
    );

    if (rpcError) {
      console.error("Error calling register_place_to_list RPC:", rpcError);
      // RPCからのエラーメッセージをより具体的にフロントに返すことも検討
      let errorMessage = "場所の登録に失敗しました。";
      let errorKey: string = "place.errors.registerFailed";
      if (rpcError.message.includes("Failed to upsert place")) {
        errorMessage = "場所情報の保存処理中にエラーが発生しました。";
        errorKey = "place.errors.placeSaveFailed";
      } else if (
        rpcError.message.includes("Failed to insert into list_places")
      ) {
        errorMessage = "リストへの場所の追加処理中にエラーが発生しました。";
        errorKey = "place.errors.addToListFailed";
      } else if (rpcError.message.includes("Failed to upsert tag")) {
        errorMessage =
          "タグの処理中にエラーが発生しました。一部のタグが登録されていない可能性があります。";
        errorKey = "place.errors.tagUpsertFailed";
      }
      // 詳細なエラーをログには残しつつ、ユーザーには汎用的なメッセージを見せる場合
      // Sentryなどのエラー監視ツールにrpcErrorを送信することを推奨
      return { success: false, error: errorMessage, errorKey };
    }

    if (!rpcData) {
      // rpcDataがnullまたはundefinedの場合 (通常はlist_place_idが返るはず)
      console.error("RPC register_place_to_list did not return expected data.");
      return {
        success: false,
        errorKey: "place.errors.noResult",
        error: "場所の登録結果を取得できませんでした。",
      };
    }

    const newListPlaceId = rpcData as string; // RPCの戻り値は UUID (string)

    // キャッシュの無効化
    revalidatePath(`/lists/${listId}`); // リスト詳細ページ
    revalidatePath("/lists"); // リスト一覧ページ (もしあれば)

    // エッジキャッシュも即座に無効化
    await revalidateListCache(listId);

    return {
      success: true,
      message: `${name} をリストに追加しました。`,
      successKey: "place.add.success",
      listPlaceId: newListPlaceId,
    };
  } catch (error) {
    console.error("Unexpected error in registerPlaceToListAction:", error);
    return {
      success: false,
      errorKey: "errors.unexpected.registerPlace",
      error: "予期せぬエラーが発生しました。場所を登録できませんでした。",
    };
  }
}

/**
 * 指定したlist_place_idに紐づくコメント一覧を取得
 */
export async function getCommentsByListPlaceId(
  listPlaceId: string
): Promise<ListPlaceComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("list_place_commnts")
    .select("id, list_place_id, user_id, comment, created_at, updated_at")
    .eq("list_place_id", listPlaceId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("コメント取得エラー", error);
    return [];
  }
  return (data as ListPlaceComment[]) || [];
}

/**
 * 指定したlist_place_idにコメントを追加
 */
export async function addCommentToListPlace(
  input: AddCommentInput
): Promise<{ success: boolean; error?: string; errorKey?: string }> {
  const supabase = await createClient();
  // 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      success: false,
      errorKey: "errors.common.unauthorized",
      error: "認証が必要です。",
    };
  }
  // バリデーション
  const result = AddCommentSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      errorKey: "errors.validation.invalidInput",
      error: result.error.errors[0]?.message || "入力内容に誤りがあります。",
    };
  }
  try {
    const { comment, listPlaceId } = result.data;
    const { error: insertError } = await supabase
      .from("list_place_commnts")
      .insert({
        list_place_id: listPlaceId,
        user_id: user.id,
        comment,
      });
    if (insertError) {
      return {
        success: false,
        errorKey: "lists.comments.saveFailed",
        error: "コメントの保存に失敗しました。",
      };
    }
    revalidatePath(`/lists/${listPlaceId}`);
    return { success: true };
  } catch (e) {
    console.error("Unexpected error in addCommentToListPlace:", e);
    return {
      success: false,
      errorKey: "errors.unexpected.generic",
      error: "予期せぬエラーが発生しました。",
    };
  }
}

export async function updateComment({
  commentId,
  comment,
}: UpdateCommentInput & { commentId: string; comment: string }): Promise<{
  success: boolean;
  error?: string;
  errorKey?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      success: false,
      errorKey: "errors.common.unauthorized",
      error: "認証が必要です。",
    };
  }
  // 権限チェック: 自分のコメントのみ
  const { data: commentData, error: fetchError } = await supabase
    .from("list_place_commnts")
    .select("user_id, list_place_id")
    .eq("id", commentId)
    .single();
  if (fetchError || !commentData) {
    return {
      success: false,
      errorKey: "lists.comments.notFound",
      error: "コメントが見つかりません。",
    };
  }
  if (commentData.user_id !== user.id) {
    return {
      success: false,
      errorKey: "errors.common.noPermission",
      error: "編集権限がありません。",
    };
  }
  // バリデーション
  const result = UpdateCommentSchema.safeParse({ commentId, comment });
  if (!result.success) {
    return {
      success: false,
      errorKey: "errors.validation.invalidInput",
      error: result.error.errors[0]?.message,
    };
  }
  const { error: updateError } = await supabase
    .from("list_place_commnts")
    .update({ comment })
    .eq("id", commentId);
  if (updateError) {
    return {
      success: false,
      errorKey: "lists.comments.updateFailed",
      error: "コメントの更新に失敗しました。",
    };
  }
  revalidatePath(`/lists/${commentData.list_place_id}`);
  return { success: true };
}

export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string; errorKey?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      success: false,
      errorKey: "errors.common.unauthorized",
      error: "認証が必要です。",
    };
  }
  // 権限チェック: 自分のコメントのみ
  const { data: commentData, error: fetchError } = await supabase
    .from("list_place_commnts")
    .select("user_id, list_place_id")
    .eq("id", commentId)
    .single();
  if (fetchError || !commentData) {
    return {
      success: false,
      errorKey: "lists.comments.notFound",
      error: "コメントが見つかりません。",
    };
  }
  if (commentData.user_id !== user.id) {
    return {
      success: false,
      errorKey: "errors.common.noPermission",
      error: "削除権限がありません。",
    };
  }
  const { error: deleteError } = await supabase
    .from("list_place_commnts")
    .delete()
    .eq("id", commentId);
  if (deleteError) {
    return {
      success: false,
      errorKey: "lists.comments.deleteFailed",
      error: "コメントの削除に失敗しました。",
    };
  }
  revalidatePath(`/lists/${commentData.list_place_id}`);
  return { success: true };
}

// EditPlaceForm.tsx から渡されるタグの型
interface ClientPlaceTag {
  id: string; // "new-tagName" または既存のUUID
  name: string;
}

// updatePlaceDetailsAction用の戻り値型を定義
export type UpdatePlaceDetailsResult = {
  success?: string;
  successKey?: string;
  error?: string;
  errorKey?: string;
  fieldErrors?: {
    [key: string]: string[];
  };
};

/**
 * 場所の詳細情報（訪問ステータス、タグ）を更新するサーバーアクション
 * @param listPlaceId 更新対象のlist_placesのID
 * @param visitedStatus 訪問ステータス
 * @param clientTags クライアントから送られてくるタグ情報の配列
 */
export async function updatePlaceDetailsAction(
  prevState: UpdatePlaceDetailsResult | null, // useFormStateのために追加
  formData: FormData
): Promise<UpdatePlaceDetailsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const rawFormData = {
    listPlaceId: formData.get("listPlaceId"),
    visitedStatus: formData.get("visitedStatus"),
    tags: JSON.parse(
      (formData.get("tags") as string) || "[]"
    ) as ClientPlaceTag[],
  };

  const validatedFields = UpdatePlaceDetailsSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error(
      "Validation Error:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      errorKey: "errors.validation.invalidInput",
      error: "入力データが無効です。",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { listPlaceId, visitedStatus, tags: clientTags } = validatedFields.data;

  try {
    // タグ名配列のみを準備
    const tagNames: string[] = clientTags.map((tag) => tag.name);

    // RPC呼び出し
    const { error: rpcError } = await supabase.rpc(
      "update_list_place_and_tags",
      {
        p_list_place_id: listPlaceId,
        p_visited_status: visitedStatus,
        p_tags: tagNames,
        p_user_id: userId,
      }
    );

    if (rpcError) throw rpcError;

    // 関連する可能性のあるパスを再検証
    revalidatePath(`/lists/${listPlaceId}`);
    revalidatePath("/settings/account");

    return {
      success: "場所の情報を更新しました。",
      successKey: "place.update.success",
    };
  } catch (error) {
    console.error("Error in updatePlaceDetailsAction:", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラーが発生しました。";
    return {
      errorKey: "place.errors.updateFailed",
      error: `場所情報の更新に失敗しました: ${errorMessage}`,
    };
  }
}

/**
 * リスト内の場所を削除するサーバーアクション
 * @param listPlaceId 削除対象のlist_placesのID
 */
export async function deleteListPlaceAction(formData: FormData) {
  const supabase = await createClient();

  const rawFormData = {
    listPlaceId: formData.get("listPlaceId"),
  };

  const validatedFields = DeletePlaceSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error(
      "Validation Error:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      errorKey: "errors.validation.invalidInput",
      error: "入力データが無効です。",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { listPlaceId } = validatedFields.data;

  try {
    // 削除前にリストIDを取得
    const { data: listPlaceData } = await supabase
      .from("list_places")
      .select("list_id")
      .eq("id", listPlaceId)
      .single();

    const { error: rpcError } = await supabase.rpc(
      "delete_list_place_cascade",
      {
        p_list_place_id: listPlaceId,
      }
    );

    if (rpcError) throw rpcError;

    const listId = listPlaceData?.list_id;
    if (listId) {
      revalidatePath(`/lists/${listId}`);
      // エッジキャッシュも即座に無効化
      await revalidateListCache(listId);
    }
    revalidatePath("/settings/account");

    return {
      success: "場所を削除しました。",
      successKey: "place.delete.success",
    };
  } catch (error) {
    console.error("Error in deleteListPlaceAction:", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラーが発生しました。";
    return {
      errorKey: "place.errors.deleteFailed",
      error: `場所の削除に失敗しました: ${errorMessage}`,
    };
  }
}
