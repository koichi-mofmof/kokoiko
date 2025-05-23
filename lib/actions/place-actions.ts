"use server";

import { createClient } from "@/lib/supabase/server";
import { PlaceToRegisterSchema } from "@/lib/validators/place";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ListPlaceComment } from "@/types";
import {
  AddCommentSchema,
  AddCommentInput,
  UpdateCommentSchema,
  UpdateCommentInput,
} from "@/lib/validators/comment";

export type PlaceToRegisterType = z.infer<typeof PlaceToRegisterSchema>;

export type RegisterPlaceResult = {
  success: boolean;
  message?: string;
  listPlaceId?: string; // 作成されたlist_placesレコードのIDなど、必要に応じて
  error?: string; // エラーメッセージ用
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
    return { success: false, error: "認証が必要です。" };
  }

  // 2. 入力データのバリデーション
  const validationResult = PlaceToRegisterSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
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
        error: "リスト内の場所の確認中にエラーが発生しました。",
      };
    }

    if (existingListPlace) {
      return {
        success: false,
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
      }
    );

    if (rpcError) {
      console.error("Error calling register_place_to_list RPC:", rpcError);
      // RPCからのエラーメッセージをより具体的にフロントに返すことも検討
      let errorMessage = "場所の登録に失敗しました。";
      if (rpcError.message.includes("Failed to upsert place")) {
        errorMessage = "場所情報の保存処理中にエラーが発生しました。";
      } else if (
        rpcError.message.includes("Failed to insert into list_places")
      ) {
        errorMessage = "リストへの場所の追加処理中にエラーが発生しました。";
      } else if (rpcError.message.includes("Failed to upsert tag")) {
        errorMessage =
          "タグの処理中にエラーが発生しました。一部のタグが登録されていない可能性があります。";
      }
      // 詳細なエラーをログには残しつつ、ユーザーには汎用的なメッセージを見せる場合
      // Sentryなどのエラー監視ツールにrpcErrorを送信することを推奨
      return { success: false, error: errorMessage };
    }

    if (!rpcData) {
      // rpcDataがnullまたはundefinedの場合 (通常はlist_place_idが返るはず)
      console.error("RPC register_place_to_list did not return expected data.");
      return {
        success: false,
        error: "場所の登録結果を取得できませんでした。",
      };
    }

    const newListPlaceId = rpcData as string; // RPCの戻り値は UUID (string)

    // キャッシュの無効化
    revalidatePath(`/lists/${listId}`); // リスト詳細ページ
    revalidatePath("/lists"); // リスト一覧ページ (もしあれば)

    return {
      success: true,
      message: `${name} をリストに追加しました。`,
      listPlaceId: newListPlaceId,
    };
  } catch (error) {
    console.error("Unexpected error in registerPlaceToListAction:", error);
    return {
      success: false,
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
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  // 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "認証が必要です。" };
  }
  // バリデーション
  const result = AddCommentSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
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
      return { success: false, error: "コメントの保存に失敗しました。" };
    }
    revalidatePath(`/lists/${listPlaceId}`);
    return { success: true };
  } catch (e) {
    console.error("Unexpected error in addCommentToListPlace:", e);
    return { success: false, error: "予期せぬエラーが発生しました。" };
  }
}

export async function updateComment({
  commentId,
  comment,
}: UpdateCommentInput & { commentId: string; comment: string }): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "認証が必要です。" };
  }
  // 権限チェック: 自分のコメントのみ
  const { data: commentData, error: fetchError } = await supabase
    .from("list_place_commnts")
    .select("user_id, list_place_id")
    .eq("id", commentId)
    .single();
  if (fetchError || !commentData) {
    return { success: false, error: "コメントが見つかりません。" };
  }
  if (commentData.user_id !== user.id) {
    return { success: false, error: "編集権限がありません。" };
  }
  // バリデーション
  const result = UpdateCommentSchema.safeParse({ commentId, comment });
  if (!result.success) {
    return { success: false, error: result.error.errors[0]?.message };
  }
  const { error: updateError } = await supabase
    .from("list_place_commnts")
    .update({ comment })
    .eq("id", commentId);
  if (updateError) {
    return { success: false, error: "コメントの更新に失敗しました。" };
  }
  revalidatePath(`/lists/${commentData.list_place_id}`);
  return { success: true };
}

export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "認証が必要です。" };
  }
  // 権限チェック: 自分のコメントのみ
  const { data: commentData, error: fetchError } = await supabase
    .from("list_place_commnts")
    .select("user_id, list_place_id")
    .eq("id", commentId)
    .single();
  if (fetchError || !commentData) {
    return { success: false, error: "コメントが見つかりません。" };
  }
  if (commentData.user_id !== user.id) {
    return { success: false, error: "削除権限がありません。" };
  }
  const { error: deleteError } = await supabase
    .from("list_place_commnts")
    .delete()
    .eq("id", commentId);
  if (deleteError) {
    return { success: false, error: "コメントの削除に失敗しました。" };
  }
  revalidatePath(`/lists/${commentData.list_place_id}`);
  return { success: true };
}
