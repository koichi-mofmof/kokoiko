"use client";

import { useI18n } from "@/hooks/use-i18n";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { autoJoinFromInvite } from "./actions";

/**
 * 実行中の参加処理をトークン単位で共有する。
 *
 * 着地直後は useAuthSync が router.refresh() を呼ぶためこのコンポーネントが
 * 作り直されることがあり、実行中のものを再利用して current_uses の二重加算を防ぐ。
 * 永続的なガード（sessionStorage 等）にしてはいけない。失敗したときに
 * リロードしても「参加中」から抜けられなくなる。
 */
const inFlightJoins = new Map<string, ReturnType<typeof autoJoinFromInvite>>();

/**
 * 招待プレビューから登録/ログインして戻ってきた人を、確認ボタンを挟まず参加させる。
 * 参加はDB書き込みなのでレンダー中には行えず、着地後にクライアントから実行する。
 */
export default function AutoJoinRunner({ token }: { token: string }) {
  const { t } = useI18n();

  useEffect(() => {
    // 失敗理由の表示と再試行は従来の確認画面に任せる
    const confirmUrl = `/lists/join?token=${encodeURIComponent(token)}`;

    let pending = inFlightJoins.get(token);
    if (!pending) {
      pending = autoJoinFromInvite(token);
      inFlightJoins.set(token, pending);
    }

    // 途中でキャンセルはしない。参加はサーバー側で完了しうるので、
    // ここで打ち切ると「参加済みなのに画面が進まない」状態になる。
    pending
      .then((result) => {
        // router.replace ではなく完全な再読み込みで着地させる。
        // 参加はアクセス権を変える操作であり、クライアントが持つRSCキャッシュは
        // 「まだ参加していない自分」の結果なので、そのまま遷移すると
        // 地点や表示順が読み込まれないままになる。
        window.location.replace(
          result.success ? `/lists/${result.listId}?joined=1` : confirmUrl
        );
      })
      // 通信断などで落ちた場合も逃がす。握り潰すと「参加中」のまま永久に止まる。
      .catch(() => window.location.replace(confirmUrl))
      .finally(() => inFlightJoins.delete(token));
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      <p className="text-neutral-500">{t("join.submitting")}</p>
    </div>
  );
}
