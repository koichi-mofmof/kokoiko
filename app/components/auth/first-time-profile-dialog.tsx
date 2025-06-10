"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { ProfileSettingsData } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/client";
import { profileSchema } from "@/lib/validators/profile";
import { Upload, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FirstTimeProfileDialogProps {
  profileData: ProfileSettingsData;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function FirstTimeProfileDialog({
  profileData,
  isOpen,
  onOpenChange,
}: FirstTimeProfileDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(profileData.avatarUrl);
  const [nickname, setNickname] = useState(profileData.displayName);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    display_name?: string[];
  }>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "画像サイズは2MB以下にしてください",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    const validationResult = profileSchema
      .pick({ display_name: true })
      .safeParse({ display_name: nickname });

    if (!validationResult.success) {
      setValidationErrors(validationResult.error.flatten().fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      let avatar_url = profileData.avatarPath;

      if (imageFile) {
        if (profileData.avatarPath) {
          const { error: removeError } = await supabase.storage
            .from("profile_images")
            .remove([profileData.avatarPath]);
          if (removeError) {
            console.warn(
              `古いアバター画像の削除に失敗しました: ${removeError.message}`,
              removeError
            );
          }
        }

        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${profileData.userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("profile_images")
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
          throw new Error(
            `画像のアップロードに失敗しました: ${uploadError.message}`
          );
        }

        avatar_url = filePath;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: profileData.userId,
        username: profileData.username,
        display_name: nickname,
        avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`プロフィールの更新に失敗しました: ${error.message}`);
      }

      toast({
        title: "ようこそ！",
        description: "プロフィールが設定されました。",
      });

      onOpenChange(false);
      router.refresh();
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            ようこそ！
          </DialogTitle>
          <DialogDescription className="text-center">
            快適にご利用いただくために、表示名とアイコンを設定してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h3 className="mb-4 text-left font-semibold">プロフィール画像</h3>
            <div className="flex flex-row items-center gap-4">
              <Avatar className="h-20 w-20 border bg-muted">
                {image ? (
                  <AvatarImage src={image} alt="プロフィール画像" />
                ) : (
                  <AvatarFallback>
                    <User className="h-10 w-10 text-muted-foreground" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-2 text-left">
                <label
                  htmlFor="profile-image-upload"
                  className="flex cursor-pointer items-center justify-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
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
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF形式で最大2MBまで
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-left font-semibold">基本情報</h3>
            <div>
              <label
                htmlFor="nickname"
                className="mb-1 block text-left text-sm"
              >
                表示名 <span className="text-red-500">*</span>
              </label>
              <Input
                id="nickname"
                value={nickname || ""}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="あなたの名前"
                maxLength={50}
                className={
                  validationErrors.display_name ? "border-red-500" : ""
                }
                required
              />
              {validationErrors.display_name?.map((error, index) => (
                <p key={index} className="mt-1 text-left text-sm text-red-500">
                  {error}
                </p>
              ))}
              <p className="mt-1 text-left text-xs text-muted-foreground">
                他のユーザーに表示される名前です。
              </p>
            </div>
          </section>

          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "保存中..." : "保存してはじめる"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
