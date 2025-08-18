"use server";

import { createClient } from "@/lib/supabase/server";
import { getTotalAvailablePlaces } from "@/lib/utils/subscription-utils";
export async function GET() {
  try {
    const supabase = await createClient();

    // ユーザー認証確認
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", errorKey: "errors.common.unauthorized" },
        { status: 401 }
      );
    }

    // 地点利用可能性情報を取得
    const placeAvailability = await getTotalAvailablePlaces(supabase, user.id);

    return Response.json({
      success: true,
      data: placeAvailability,
    });
  } catch (error: unknown) {
    console.error("Place limits API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        errorKey: "errors.common.internalError",
      },
      { status: 500 }
    );
  }
}
