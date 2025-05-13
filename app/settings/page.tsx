import { ProfileSettings } from "./_components/profile-settings";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  // ユーザー情報の取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <p>ログインしてください</p>
        </div>
      </div>
    );
  }

  // プロフィール情報の取得
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("id", user.id)
    .single();

  // プロフィール画像URLの取得
  let avatarUrl = null;
  if (profile?.avatar_url) {
    const { data: imageData } = await supabase.storage
      .from("profile_images")
      .getPublicUrl(profile.avatar_url);

    avatarUrl = imageData?.publicUrl || null;
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <ProfileSettings
        initialData={{
          userId: user.id,
          username: profile?.username || "",
          displayName: profile?.display_name || "",
          bio: profile?.bio || "",
          avatarUrl,
          avatarPath: profile?.avatar_url || null,
        }}
      />
    </div>
  );
}
