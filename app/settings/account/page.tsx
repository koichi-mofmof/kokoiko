"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { z } from "zod";

// パスワードバリデーションスキーマ
const passwordSchema = z
  .object({
    currentPassword: z
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
    message: "新しいパスワードは現在のパスワードと異なる必要があります",
    path: ["newPassword"], // エラーメッセージを表示するフィールド
  });

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    currentPassword?: string[];
    newPassword?: string[];
  }>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("認証エラー:", error.message);
          toast({
            variant: "destructive",
            title: "エラー",
            description: "ユーザー情報の取得に失敗しました",
          });
          return;
        }

        if (data && data.user) {
          setUserEmail(data.user.email || "");
        } else {
          setUserEmail("未ログイン");
        }
      } catch (err) {
        console.error("データ取得エラー:", err);
        toast({
          variant: "destructive",
          title: "エラー",
          description: "ユーザー情報の読み込みに失敗しました",
        });
      }
    };

    fetchUserData();
  }, [toast]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    // パスワードバリデーション
    const validationResult = passwordSchema.safeParse({
      currentPassword,
      newPassword,
    });

    if (!validationResult.success) {
      setValidationErrors(validationResult.error.flatten().fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 現在のパスワードで認証を試みる
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "現在のパスワードが正しくありません",
        });
        setIsLoading(false);
        return;
      }

      // パスワード更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: `パスワードの更新に失敗しました: ${updateError.message}`,
        });
        setIsLoading(false);
        return;
      }

      // 成功メッセージを表示
      toast({
        title: "成功",
        description: "パスワードが正常に変更されました",
      });

      // フォームをリセット
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("パスワード更新エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "パスワードの更新中にエラーが発生しました",
      });
    } finally {
      setIsLoading(false);
    }
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
        <div>
          <h3 className="text-md font-medium mb-2">メールアドレス</h3>
          <p className="text-md">{userEmail || "読み込み中..."}</p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-full">
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
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full ${
                  validationErrors.currentPassword ? "border-red-500" : ""
                }`}
                required
              />
              {validationErrors.currentPassword?.map((error, index) => (
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
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full ${
                  validationErrors.newPassword ? "border-red-500" : ""
                }`}
                required
              />
              {validationErrors.newPassword?.map((error, index) => (
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
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary-600 text-white hover:bg-primary-600/90 w-full sm:w-auto px-8"
            >
              {isLoading ? "処理中..." : "パスワードを変更"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
