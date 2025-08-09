import { verifyShareToken } from "@/lib/actions/lists";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import JoinListForm from "./JoinListForm";

export default async function JoinListPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "ja";
  const locale = normalizeLocale(lang);
  const messages = await loadMessages(locale);
  const t = createServerT(messages);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("join.invalidLinkTitle")}
        </h2>
        <p className="text-neutral-500 mb-4">{t("join.tokenMissingDesc")}</p>
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
        <h2 className="text-xl font-semibold mb-2">
          {t("join.invalidLinkTitle")}
        </h2>
        <p className="text-neutral-500 mb-4">
          {verifyResult.reason || t("join.invalidLinkDesc")}
        </p>
        <Link href="/lists" className="text-primary-600 hover:underline mt-4">
          {t("join.backToLists")}
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
