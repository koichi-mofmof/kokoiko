import { getSharedListPreview } from "@/lib/actions/share-preview";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import AutoJoinRunner from "./AutoJoinRunner";
import GuestJoinPreview from "./GuestJoinPreview";
import JoinListForm from "./JoinListForm";

function JoinError({
  title,
  description,
  back,
}: {
  title: string;
  description: string;
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-neutral-500 mb-4">{description}</p>
      {back && (
        <Link href={back.href} className="text-primary-600 hover:underline mt-4">
          {back.label}
        </Link>
      )}
    </div>
  );
}

export default async function JoinListPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; auto?: string }>;
}) {
  const { token, auto } = await searchParams;
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
      <JoinError
        title={t("join.invalidLinkTitle")}
        description={t("join.tokenMissingDesc")}
      />
    );
  }

  // 招待プレビューから登録/ログインして戻ってきた場合は、確認を挟まず参加まで完了させる。
  // 書き込みはレンダー中に行えないため、クライアント側から実行する。
  if (user && auto === "1") {
    return <AutoJoinRunner token={token} />;
  }

  // まだ参加していない人は RLS で地点を読めないため、ログイン有無にかかわらず
  // service_role 経由のプレビューを使う。トークン検証もここで兼ねる。
  const preview = await getSharedListPreview(token);

  if (!preview.success) {
    return (
      <JoinError
        title={t("join.invalidLinkTitle")}
        description={t(preview.reasonKey)}
        back={
          user
            ? { href: "/lists", label: t("join.backToLists") }
            : { href: "/", label: t("notFound.backHome") }
        }
      />
    );
  }

  // 未ログインには登録導線を、ログイン済みには参加ボタンを出す。中身の見え方は同じ。
  if (!user) {
    return <GuestJoinPreview token={token} preview={preview} />;
  }

  return <JoinListForm token={token} preview={preview} />;
}
