"use client";

import { createClient } from "@/lib/supabase/client";
import {
  disarmPendingCopyResume,
  isPendingCopyResumeArmed,
  peekAnyPendingCopyIntent,
} from "@/lib/utils/pending-copy";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 体験先行コピー導線の「着地ズレ」保険。
 *
 * ゲストが保存してサインアップへ進んだ時だけ「武装(arm)」され、登録後に
 * どのページへ着地しても、保存済みのコピー意図があればソースリストへ
 * 一度だけ誘導する（そこで ResumeCopy がモーダルを開く）。処理したら即解除。
 *
 * 背景: OAuth では Supabase の Redirect URL 設定次第で、クエリ付きの
 * `redirect_url` が許可リストに一致せず Site URL（TOP）へフォールバック
 * することがある。着地ページに依存せずクライアント側で復帰させる。
 *
 * 重要: 武装中のときだけ動作するため、古い意図が localStorage に残っていても
 * 平常時のナビゲーション（ログイン遷移など）を一切妨げない。
 */
export function usePendingCopyRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const handlingRef = useRef(false);

  useEffect(() => {
    if (handlingRef.current) return;
    // 武装していない＝この導線のセッションではない → 何もしない
    if (!isPendingCopyResumeArmed()) return;

    const intent = peekAnyPendingCopyIntent();
    if (!intent) {
      disarmPendingCopyResume();
      return;
    }

    const target = `/lists/${intent.sourceListId}`;
    if (pathname === target) {
      // 既に対象ページ（ResumeCopy が処理）。以降の引き戻しを防ぐため解除。
      disarmPendingCopyResume();
      return;
    }

    handlingRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          // まだ登録/ログインが完了していない → 武装は維持し、次の遷移で再判定
          handlingRef.current = false;
          return;
        }
        disarmPendingCopyResume();
        router.replace(target);
      } catch {
        handlingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);
}
