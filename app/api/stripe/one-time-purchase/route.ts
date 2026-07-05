"use server";

// 買い切り（地点追加パック）の新規販売は終了しました。
// 既存クレジットは引き続き利用可能ですが、新規購入は受け付けません。
// 古いクライアントからの購入リクエスト対策として 410 Gone を返します。
export async function POST() {
  return Response.json(
    {
      error: "One-time purchases are no longer available",
      errorKey: "errors.stripe.oneTimePurchaseDiscontinued",
    },
    { status: 410 }
  );
}
