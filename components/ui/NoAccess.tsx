import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NoAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 md:py-16">
      <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-red-500 mb-3 md:mb-4" />
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-2 text-center">
        アクセス権限がありません
      </h2>
      <p className="text-sm md:text-base text-neutral-500 mb-6 md:mb-4 text-center max-w-md leading-relaxed">
        このリストを表示する権限がありません。
        <br />
        リストのオーナーまたは共有ユーザーのみが閲覧できます。
      </p>
      {user ? (
        <Link
          href="/lists"
          className="text-primary-600 hover:underline text-sm md:text-base px-4 py-2 hover:bg-primary-50 rounded-md transition-colors"
        >
          マイリスト一覧に戻る
        </Link>
      ) : (
        <Link
          href="/"
          className="text-primary-600 hover:underline text-sm md:text-base px-4 py-2 hover:bg-primary-50 rounded-md transition-colors"
        >
          ホームに戻る
        </Link>
      )}
    </div>
  );
}
