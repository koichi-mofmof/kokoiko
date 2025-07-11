"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { ProfileSettingsData } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/client";
import {
  generateSecureFilePath,
  validateFileContent,
  validateFileUpload,
} from "@/lib/utils/file-security";
import { profileSchema } from "@/lib/validators/profile";
import { Upload, User } from "lucide-react";
import { useState } from "react";

interface ProfileSettingsProps {
  initialData: ProfileSettingsData;
}

export function ProfileSettings({ initialData }: ProfileSettingsProps) {
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(initialData.avatarUrl);
  const [nickname, setNickname] = useState(initialData.displayName);
  const [bio, setBio] = useState(initialData.bio);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    display_name?: string[];
    bio?: string[];
  }>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // セキュリティ検証
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: validation.error,
      });
      // ファイル入力をクリア
      e.target.value = "";
      return;
    }

    // ファイル内容の検証（マジックナンバーチェック）
    const isValidContent = await validateFileContent(file);
    if (!isValidContent) {
      toast({
        variant: "destructive",
        title: "エラー",
        description:
          "ファイルの内容が無効です。正しい画像ファイルをアップロードしてください。",
      });
      e.target.value = "";
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    // プロフィールバリデーション
    const profileData = {
      display_name: nickname,
      bio,
    };

    const validationResult = profileSchema.safeParse(profileData);

    if (!validationResult.success) {
      setValidationErrors(validationResult.error.flatten().fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      let avatar_url = initialData.avatarPath;

      // 新しい画像がアップロードされた場合
      if (imageFile) {
        // 古い画像が存在する場合、Storageから削除
        if (initialData.avatarPath) {
          const { error: removeError } = await supabase.storage
            .from("profile_images")
            .remove([initialData.avatarPath]);

          if (removeError) {
            // 削除エラーはログには残すが、処理は続行する（致命的なエラーとはしない）
            console.warn(
              `古いアバター画像の削除に失敗しました: ${removeError.message}`,
              removeError // エラーオブジェクト全体を出力するように変更
            );
          }
        }

        // セキュアなファイルパス生成
        const filePath = generateSecureFilePath(
          initialData.userId,
          imageFile.name
        );

        // Storageにアップロード
        const { error: uploadError } = await supabase.storage
          .from("profile_images")
          .upload(filePath, imageFile, {
            upsert: true,
          });

        if (uploadError) {
          throw new Error(
            `画像のアップロードに失敗しました: ${uploadError.message}`
          );
        }

        avatar_url = filePath;
      }

      // プロフィール情報を更新
      const { error } = await supabase.from("profiles").upsert({
        id: initialData.userId,
        username: initialData.username, // 既存の値を維持
        display_name: nickname,
        bio,
        avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`プロフィールの更新に失敗しました: ${error.message}`);
      }

      // 成功メッセージを表示
      toast({
        title: "成功",
        description: "プロフィール情報が正常に更新されました",
      });

      // プロフィール更新イベントを発火
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description:
          error instanceof Error
            ? error.message
            : "プロフィールの更新中にエラーが発生しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-0 sm:px-4">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
          <CardDescription>
            プロフィール画像や基本情報を設定してください。
            <span className="text-red-500">*</span> は必須項目です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8 w-full">
            <section className="w-full">
              <h3 className="mb-4 text-left">プロフィール画像</h3>
              <div className="flex flex-row items-center sm:items-start gap-4 sm:gap-6">
                <Avatar className="h-16 w-16 border bg-muted">
                  {image ? (
                    <AvatarImage src={image} alt="プロフィール画像" />
                  ) : (
                    <AvatarFallback className="text-lg">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-2 text-left w-auto">
                  <div className="relative">
                    <label
                      htmlFor="profile-image-upload"
                      className="flex items-center justify-center px-3 py-1.5 text-sm border rounded-md hover:bg-accent cursor-pointer"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      画像をアップロード
                    </label>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                      aria-label="プロフィール画像をアップロード"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF形式で最大2MBまで
                  </p>
                </div>
              </div>
            </section>

            <section className="w-full">
              <h3 className="font-medium mb-4 text-left">基本情報</h3>
              <div className="space-y-5 w-full">
                <div className="w-full">
                  <label
                    htmlFor="nickname"
                    className="block mb-1 text-sm text-left"
                  >
                    表示名 <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full">
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="あなたの名前"
                      maxLength={50}
                      className={`w-full ${
                        validationErrors.display_name ? "border-red-500" : ""
                      }`}
                      required
                    />
                  </div>
                  {validationErrors.display_name?.map((error, index) => (
                    <p
                      key={index}
                      className="mt-1 text-sm text-red-500 text-left"
                    >
                      {error}
                    </p>
                  ))}
                  <p className="mt-1 text-xs text-muted-foreground text-left">
                    50文字以内で入力してください
                  </p>
                </div>

                <div className="w-full">
                  <label htmlFor="bio" className="block mb-1 text-sm text-left">
                    自己紹介
                  </label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="あなたの自己紹介"
                    rows={5}
                    maxLength={500}
                    className={`resize-none w-full ${
                      validationErrors.bio ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.bio?.map((error, index) => (
                    <p
                      key={index}
                      className="mt-1 text-sm text-red-500 text-left"
                    >
                      {error}
                    </p>
                  ))}
                  <div className="flex justify-end mt-1">
                    <p className="text-xs text-muted-foreground">
                      {bio.length}/500文字
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-center sm:justify-end w-full">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary-600 text-white hover:bg-primary-600/90 w-full sm:w-auto px-8"
              >
                {isLoading ? "保存中..." : "変更を保存"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
