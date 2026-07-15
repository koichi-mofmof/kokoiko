"use client";

import { createClient } from "@/lib/supabase/client";
import type { Place } from "@/types";
import {
  clearPendingCopyIntent,
  peekPendingCopyIntent,
  type PendingCopyIntent,
} from "@/lib/utils/pending-copy";
import { useEffect, useState } from "react";
import { TemplateCopyModal } from "./TemplateCopyModal";

interface ResumeCopyProps {
  sourceListId: string;
  places: Place[];
  isLoggedIn: boolean;
}

/**
 * 体験先行コピー導線の「登録後の復元」担当。
 * リスト詳細ページに常設し、当該リスト宛のコピー意図が保存されていれば
 * TemplateCopyModal を値入り・target ステップで自動オープンする。
 * ユーザーは内容を確認して「コピーする」をワンタップするだけで完遂できる。
 *
 * 堅牢性のための設計:
 * - localStorage は「非破壊」で覗く（peek）。再マウント・StrictModeの二重実行・
 *   router.refresh 等が起きても意図を失わない。実際に消すのはモーダルを閉じた/完了した時。
 * - サインアップ直後の redirect 着地では、SSR の `isLoggedIn` がまだ false のことがある
 *   （セッションCookieの反映遅延）。その場合はクライアント側でセッションを確認してから開く。
 */
export function ResumeCopy({
  sourceListId,
  places,
  isLoggedIn,
}: ResumeCopyProps) {
  const [intent, setIntent] = useState<PendingCopyIntent | null>(null);

  useEffect(() => {
    const pending = peekPendingCopyIntent(sourceListId);
    if (!pending) return;

    let cancelled = false;

    const openIfAuthed = async () => {
      let authed = isLoggedIn;
      if (!authed) {
        // SSR の user がまだ反映されていない可能性があるため、クライアントで確認
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          authed = !!user;
        } catch {
          authed = false;
        }
      }
      if (cancelled) return;
      // 未ログイン（＝まだ登録が完了していない）の場合は意図を残したまま開かない
      if (authed) setIntent(pending);
    };

    openIfAuthed();
    return () => {
      cancelled = true;
    };
  }, [sourceListId, isLoggedIn]);

  if (!intent) return null;

  return (
    <TemplateCopyModal
      open
      onOpenChange={(o) => {
        if (!o) {
          clearPendingCopyIntent();
          setIntent(null);
        }
      }}
      sourceListId={sourceListId}
      places={places}
      isLoggedIn
      resumeIntent={intent}
    />
  );
}
