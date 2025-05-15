"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateUserPassword } from "@/lib/actions/auth";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { z } from "zod";

// クライアントサイドバリデーション用スキーマ
const passwordClientSchema = z
  .object({
    currentPassword: z // UI上残すがサーバーでは使用しない
      .string()
      .min(1, { message: "現在のパスワードを入力してください。" }),
    newPassword: z
      .string()
      .min(8, { message: "パスワードは8文字以上で入力してください。" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, {
        message:
          'パスワードは英大文字、小文字、数字、記号(!@#$%^&*(),.?":{}|<>)をそれぞれ1文字以上含める必要があります。',
      }),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "新しいパスワードは現在のパスワードと異なる必要があります。",
    path: ["newPassword"],
  });

// SubmitButtonコンポーネントを定義してpending状態をハンドリング
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-primary-600 text-white hover:bg-primary-600/90 w-full sm:w-auto px-8"
    >
      {pending ? "処理中..." : "パスワードを変更"}
    </Button>
  );
}

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // const [userEmail, setUserEmail] = useState(""); // Server Action内で取得するため不要に
  const [clientValidationErrors, setClientValidationErrors] = useState<{
    currentPassword?: string[];
    newPassword?: string[];
  }>({});

  const initialState = { success: false, message: "", errors: [] };
  const [state, formAction] = useActionState(updateUserPassword, initialState);

  // useEffect(() => { // userEmailを取得するuseEffectは不要になった
  //   const fetchUserData = async () => { ... };
  //   fetchUserData();
  // }, [toast]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "成功",
          description: state.message,
        });
        setCurrentPassword("");
        setNewPassword("");
        setClientValidationErrors({});
      } else {
        toast({
          variant: "destructive",
          title: "エラー",
          description: state.message,
        });
        if (state.errors) {
          const newErrors: {
            currentPassword?: string[];
            newPassword?: string[];
          } = {};
          state.errors.forEach((err) => {
            // Server ActionはnewPasswordフィールドのエラーのみ返す想定
            if (err.field === "newPassword") {
              newErrors[err.field] = [
                ...(newErrors[err.field] || []),
                err.message,
              ];
            }
          });
          setClientValidationErrors(newErrors);
        }
      }
    }
  }, [state, toast]);

  const handleClientValidation = () => {
    setClientValidationErrors({});
    // バリデーションスキーマはcurrentPasswordを含むが、サーバーはnewPasswordのみ見る
    const validationResult = passwordClientSchema.safeParse({
      currentPassword,
      newPassword,
    });
    if (!validationResult.success) {
      setClientValidationErrors(validationResult.error.flatten().fieldErrors);
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6 px-0 sm:px-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">アカウント設定</h2>
        <p className="text-sm text-muted-foreground">
          アカウントのセキュリティ設定を管理します
        </p>
      </div>

      <div className="space-y-6">
        <form
          action={(formData) => {
            if (!handleClientValidation()) return;
            const newFormData = new FormData();
            newFormData.append(
              "newPassword",
              formData.get("newPassword") as string
            );
            formAction(newFormData);
          }}
          className="space-y-4 max-w-full"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="current-password"
                className="block text-sm font-medium mb-1"
              >
                現在のパスワード
              </label>
              <Input
                id="current-password"
                name="currentPassword" // nameは残すがサーバーでは利用しない
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full ${
                  clientValidationErrors.currentPassword ? "border-red-500" : ""
                }`}
                required // UI上は必須のまま
              />
              {clientValidationErrors.currentPassword?.map((error, index) => (
                <p key={index} className="mt-1 text-sm text-red-500">
                  {error}
                </p>
              ))}
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium mb-1"
              >
                新しいパスワード
              </label>
              <Input
                id="new-password"
                name="newPassword" // これがServer Actionに渡される
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full ${
                  clientValidationErrors.newPassword ? "border-red-500" : ""
                }`}
                required
              />
              {clientValidationErrors.newPassword?.map((error, index) => (
                <p key={index} className="mt-1 text-sm text-red-500">
                  {error}
                </p>
              ))}
              <p className="mt-1 text-xs text-muted-foreground">
                パスワードは8文字以上で、英大文字、小文字、数字、記号をそれぞれ1文字以上含める必要があります。
              </p>
            </div>
          </div>

          <div className="flex justify-center sm:justify-end w-full">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
