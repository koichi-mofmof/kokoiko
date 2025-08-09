import { UserProfileView } from "@/app/components/users/UserProfileView";
import {
  getUserProfile,
  getUserPublicLists,
  getUserStats,
} from "@/lib/dal/user-public-lists";
import {
  createServerT,
  loadMessages,
  normalizeLocale,
  toOpenGraphLocale,
} from "@/lib/i18n";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const userProfile = await getUserProfile(userId);
  const displayName = userProfile?.display_name || userProfile?.username;

  if (!displayName) {
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("lang")?.value);
    const msgs = await loadMessages(locale);
    const t = createServerT(msgs as Record<string, string>);
    return {
      title: t("user.notFound.title"),
      description: t("user.notFound.desc"),
    };
  }

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value);
  const msgs = await loadMessages(locale);
  const t = createServerT(msgs as Record<string, string>);
  return {
    title: t("user.publicLists.title", { name: displayName }),
    description: t("user.publicLists.desc", { name: displayName }),
    openGraph: {
      title: t("user.publicLists.title", { name: displayName }),
      description: t("user.publicLists.desc", { name: displayName }),
      images: userProfile?.avatar_url
        ? [
            {
              url: userProfile.avatar_url,
              width: 128,
              height: 128,
              alt: displayName,
            },
          ]
        : [],
      locale: toOpenGraphLocale(locale),
    },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;

  const [userProfile, userLists, userStats] = await Promise.all([
    getUserProfile(userId),
    getUserPublicLists(userId),
    getUserStats(userId),
  ]);

  if (!userProfile) {
    notFound();
  }

  return (
    <UserProfileView
      profile={userProfile}
      lists={userLists}
      stats={userStats}
    />
  );
}
