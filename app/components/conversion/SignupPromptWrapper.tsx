"use client";

import { useSignupPrompt } from "@/hooks/use-signup-prompt";
import { SignupPromptBanner } from "./SignupPromptBanner";

interface SignupPromptWrapperProps {
  listId: string;
  showBanner?: boolean; // バナー表示のオプション
}

export function SignupPromptWrapper({
  listId,
  showBanner = false,
}: SignupPromptWrapperProps) {
  const { isLoggedIn, shouldShowBanner, hideBanner } = useSignupPrompt();

  // ログインユーザーには何も表示しない
  if (isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* 常時表示バナー */}
      {showBanner && shouldShowBanner && (
        <SignupPromptBanner listId={listId} onDismiss={hideBanner} />
      )}
    </>
  );
}
