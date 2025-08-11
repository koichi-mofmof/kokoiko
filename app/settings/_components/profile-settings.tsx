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
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import type { ProfileSettingsData } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/client";
import {
  generateSecureFilePath,
  validateFileContent,
  validateFileUpload,
} from "@/lib/utils/file-security";
import { resizeImage } from "@/lib/utils/image-optimization";
import { profileSchema } from "@/lib/validators/profile";
import { Upload, User } from "lucide-react";
import { useState } from "react";

interface ProfileSettingsProps {
  initialData: ProfileSettingsData;
}

export function ProfileSettings({ initialData }: ProfileSettingsProps) {
  const { toast } = useToast();
  const { t } = useI18n();
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
        title: t("common.error"),
        description: validation.errorKey
          ? t(validation.errorKey)
          : validation.error,
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
        title: t("common.error"),
        description: t("settings.profile.image.invalidContent"),
      });
      e.target.value = "";
      return;
    }

    // 画像をリサイズして最適化
    const optimizedFile = await resizeImage(file, 200, 200);
    setImageFile(optimizedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(optimizedFile);
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
            console.warn(
              `Failed to remove old avatar: ${removeError.message}`,
              removeError
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
            t("settings.profile.image.uploadFailed", {
              message: uploadError.message,
            })
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
        title: t("common.success"),
        description: t("settings.profile.update.success"),
      });

      // プロフィール更新イベントを発火
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch (error) {
      console.error("profile update error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error instanceof Error
            ? error.message
            : t("settings.profile.update.unexpected"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-0 sm:px-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.title")}</CardTitle>
          <CardDescription>
            {t("settings.profile.description")}{" "}
            <span className="text-red-500">*</span>{" "}
            {t("settings.profile.requiredNote")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8 w-full">
            <section className="w-full">
              <h3 className="mb-4 text-left">
                {t("settings.profile.image.title")}
              </h3>
              <div className="flex flex-row items-center sm:items-start gap-4 sm:gap-6">
                <Avatar className="h-16 w-16 border bg-muted">
                  {image ? (
                    <AvatarImage
                      src={image}
                      alt={t("settings.profile.image.alt")}
                    />
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
                      {t("settings.profile.image.upload")}
                    </label>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                      aria-label={t("settings.profile.image.uploadAria")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.profile.image.help")}
                  </p>
                </div>
              </div>
            </section>

            <section className="w-full">
              <h3 className="font-medium mb-4 text-left">
                {t("settings.profile.basic.title")}
              </h3>
              <div className="space-y-5 w-full">
                <div className="w-full">
                  <label
                    htmlFor="nickname"
                    className="block mb-1 text-sm text-left"
                  >
                    {t("settings.profile.basic.displayName")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full">
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={t("settings.profile.basic.namePlaceholder")}
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
                    {t("settings.profile.basic.max50")}
                  </p>
                </div>

                <div className="w-full">
                  <label htmlFor="bio" className="block mb-1 text-sm text-left">
                    {t("settings.profile.basic.bio")}
                  </label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t("settings.profile.basic.bioPlaceholder")}
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
                      {t("settings.profile.basic.bioCount", { n: bio.length })}
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
                {isLoading
                  ? t("settings.profile.saving")
                  : t("settings.profile.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
