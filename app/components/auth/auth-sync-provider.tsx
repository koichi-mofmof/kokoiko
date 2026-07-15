"use client";

import { useAuthSync } from "@/hooks/use-auth-sync";
import { usePendingCopyRedirect } from "@/hooks/use-pending-copy-redirect";

interface AuthSyncProviderProps {
  children: React.ReactNode;
}

/**
 * OAuth認証後のセッション状態同期を管理するプロバイダー
 */
export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  useAuthSync();
  // 着地ページに依存せず、保存済みのコピー意図があればソースリストへ誘導
  usePendingCopyRedirect();

  return <>{children}</>;
}
