"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { buildAuthHref } from "@/lib/utils/auth-redirect";
import Link from "next/link";
import InviteListPreview, { type InvitePreview } from "./InviteListPreview";

/**
 * 未ログインで招待リンクを開いた人に、まず中身を見せる画面。
 * 会員登録を求めるのは「参加する（＝編集する）」を押した時点まで遅らせる。
 */
export default function GuestJoinPreview({
  token,
  preview,
}: {
  token: string;
  preview: InvitePreview;
}) {
  const { t } = useI18n();

  // auto=1 付きで戻し、着地後に確認ボタンを挟まず参加まで完了させる
  const joinPath = `/lists/join?token=${encodeURIComponent(token)}&auto=1`;
  const authParams = new URLSearchParams({ redirect_url: joinPath });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <InviteListPreview preview={preview} />

      <div className="space-y-3 text-center">
        <Button asChild size="lg" className="w-full">
          <Link href={buildAuthHref("/signup", authParams)}>
            {t("join.guest.cta")}
          </Link>
        </Button>
        <p className="text-sm text-neutral-500">{t("join.guest.ctaNote")}</p>
        <p className="text-sm">
          {t("auth.common.alreadyHaveAccount")}{" "}
          <Link
            href={buildAuthHref("/login", authParams)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("auth.common.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
