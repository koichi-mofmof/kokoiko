import { cookies } from "next/headers";
import { redirect } from "next/navigation"; // 未認証時のリダイレクト用
import { ProfileSettings } from "./_components/profile-settings";
import { SettingsPageDataLoader } from "./_components/SettingsPageDataLoader";
import { createServerT, loadMessages, normalizeLocale } from "@/lib/i18n";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  const { initialData, error, userUnauthenticated } =
    await SettingsPageDataLoader();

  if (userUnauthenticated) {
    redirect("/login"); // 未認証の場合はログインページへ
  }

  if (error || !initialData) {
    return (
      <div className="container max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-red-500">{error || t("settings.loadError")}</p>
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
