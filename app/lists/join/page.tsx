import { verifyShareToken } from "@/lib/actions/lists";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import JoinListForm from "./JoinListForm";

export default async function JoinListPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">無効なリンク</h2>
        <p className="text-neutral-500 mb-4">
          共有リンクのトークンが見つかりません。URLをご確認ください。
        </p>
      </div>
    );
  }

  if (!user) {
    // 未ログインの場合はログインページへリダイレクト
    redirect(
      "/login?redirect_url=" + encodeURIComponent("/lists/join?token=" + token)
    );
    return null; // ここで以降の実行を防ぐ
  }

  // トークン検証
  const verifyResult = await verifyShareToken(token);

  if (!verifyResult.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">リンクが無効です</h2>
        <p className="text-neutral-500 mb-4">{verifyResult.reason}</p>
        <Link href="/lists" className="text-primary-600 hover:underline mt-4">
          マイリスト一覧に戻る
        </Link>
      </div>
    );
  }

  // 有効な場合はクライアントフォームを表示
  const verifiedDataForForm = {
    permission: verifyResult.permission as "view" | "edit",
    listName: verifyResult.listName || null,
    ownerName: verifyResult.ownerName || null,
  };
  return <JoinListForm token={token} verifyResult={verifiedDataForForm} />;
}
