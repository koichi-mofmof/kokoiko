"use client";

import { useSignupPrompt } from "@/hooks/use-signup-prompt";
import { SignupPromptModal } from "./SignupPromptModal";

interface SignupPromptWrapperProps {
  listId: string;
}

export function SignupPromptWrapper({ listId }: SignupPromptWrapperProps) {
  const { shouldShow, hidePrompt } = useSignupPrompt();

  return (
    <SignupPromptModal
      isOpen={shouldShow}
      onClose={hidePrompt}
      listId={listId}
      variant="default"
    />
  );
}
