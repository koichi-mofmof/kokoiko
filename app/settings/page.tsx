import { ProfileSettings } from "./_components/profile-settings";
import { redirect } from "next/navigation"; // 未認証時のリダイレクト用
import { SettingsPageDataLoader } from "./_components/SettingsPageDataLoader";

export default async function SettingsPage() {
  const { initialData, error, userUnauthenticated } =
    await SettingsPageDataLoader();

  if (userUnauthenticated) {
    redirect("/login"); // 未認証の場合はログインページへ
  }

  if (error || !initialData) {
    return (
      <div className="container max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-red-500">
            {error || "設定情報の読み込みに失敗しました。"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto">
      {/* initialDataがnullでないことは上でチェック済みなのでそのまま渡せる */}
      <ProfileSettings initialData={initialData} />
    </div>
  );
}
