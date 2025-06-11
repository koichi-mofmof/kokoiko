"use client";

import { useAuthSync } from "@/hooks/use-auth-sync";

interface AuthSyncProviderProps {
  children: React.ReactNode;
}

/**
 * OAuth認証後のセッション状態同期を管理するプロバイダー
 */
export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  useAuthSync();

  return <>{children}</>;
}
