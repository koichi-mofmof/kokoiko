"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type ErrorMessageToastProps = {
  errorMessage?: string;
};

export function ErrorMessageToast({ errorMessage }: ErrorMessageToastProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (errorMessage) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
    }
  }, [errorMessage, toast]);

  return null; // This component does not render anything itself
}
