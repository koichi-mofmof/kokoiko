import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NoAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">アクセス権限がありません</h2>
      <p className="text-neutral-500 mb-4">
        このリストを表示する権限がありません。
        <br />
        リストのオーナーまたは共有ユーザーのみが閲覧できます。
      </p>
      {user ? (
        <Link href="/lists" className="text-primary-600 hover:underline">
          マイリスト一覧に戻る
        </Link>
      ) : (
        <Link href="/" className="text-primary-600 hover:underline">
          ホームに戻る
        </Link>
      )}
    </div>
  );
}
