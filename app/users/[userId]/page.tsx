import { notFound } from "next/navigation";
import {
  getUserProfile,
  getUserPublicLists,
  getUserStats,
} from "@/lib/dal/user-public-lists";
import { UserProfileView } from "@/app/components/users/UserProfileView";
import type { Metadata } from "next";

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
    return {
      title: "ユーザーが見つかりません",
      description: "指定されたユーザーは存在しません。",
    };
  }

  return {
    title: `${displayName}さんの公開リスト一覧`,
    description: `${displayName}さんが作成した公開リストを閲覧できます。`,
    openGraph: {
      title: `${displayName}さんの公開リスト一覧`,
      description: `${displayName}さんが作成した公開リストを閲覧できます。`,
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
