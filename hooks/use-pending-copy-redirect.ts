"use client";

import { createClient } from "@/lib/supabase/client";
import { peekAnyPendingCopyIntent } from "@/lib/utils/pending-copy";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 体験先行コピー導線の「着地ズレ」保険。
 *
 * サインアップ後にどのページへ着地しても、保存済みのコピー意図があり
 * ログイン済みであれば、ソースリストのページへ一度だけ誘導する。
 * （そこで ResumeCopy がモーダルを開き、ワンタップで完遂できる。）
 *
 * 背景: OAuth では Supabase の Redirect URL 設定次第で、クエリ付き
 * `redirect_url` が許可リストに一致せず Site URL（TOP）へフォールバック
 * することがある。localStorage の意図は残るため、着地ページに依存せず
 * クライアント側で復帰させることで堅牢化する。
 */
export function usePendingCopyRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  // 1マウントにつき誘導は一度だけ（意図せぬ引き戻しループを防ぐ）
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;

    const intent = peekAnyPendingCopyIntent();
    if (!intent) return;

    const target = `/lists/${intent.sourceListId}`;
    if (pathname === target) return; // 既に対象ページ（ResumeCopyが処理）

    let cancelled = false;
    (async () => {
      // ログイン済みのときだけ誘導（登録未完了のゲストは対象外）
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user) return;
        redirectedRef.current = true;
        router.replace(target);
      } catch {
        /* セッション確認に失敗した場合は何もしない */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);
}
