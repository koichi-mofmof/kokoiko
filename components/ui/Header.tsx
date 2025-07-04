"use client";

import { SubscriptionStatus } from "@/app/components/billing/SubscriptionStatus";
import { UpgradePlanDialog } from "@/app/components/billing/UpgradePlanDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/use-subscription";
import { SUBSCRIPTION_LIMITS } from "@/lib/constants/config/subscription";
import { createClient } from "@/lib/supabase/client";
import { List, LogIn, LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface HeaderProps {
  currentUser?: {
    name: string;
    id: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  onLogout?: () => void;
}

const Header = ({ currentUser: initialUser, onLogout }: HeaderProps) => {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isClient, setIsClient] = useState(false);
  const {
    plan: subscriptionPlan,
    registeredPlacesTotal, // registeredPlacesThisMonth → registeredPlacesTotal
    maxPlaces,
    sharedListCount,
    loading: planLoading,
    isPremium,
  } = useSubscription();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const plan =
    subscriptionPlan === "premium" ? "プレミアムプラン" : "フリープラン";
  const maxSharedLists = isPremium
    ? null
    : SUBSCRIPTION_LIMITS.free.MAX_SHARED_LISTS;

  // プロフィール情報の再取得（useCallbackでラップ）
  const refreshUserProfile = useCallback(async () => {
    if (!initialUser) return;

    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", initialUser.id)
        .single();

      if (profile) {
        let avatarUrl = null;
        if (profile.avatar_url) {
          const { data: imageData } = await supabase.storage
            .from("profile_images")
            .getPublicUrl(profile.avatar_url);

          avatarUrl = imageData?.publicUrl || null;
        }

        setCurrentUser({
          ...initialUser,
          name: profile.display_name || initialUser.name,
          avatarUrl: avatarUrl || initialUser.avatarUrl,
        });
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  }, [initialUser]);

  // プロフィール更新イベントのリスナー
  useEffect(() => {
    if (!initialUser) return;

    // イベントリスナーの設定
    const handleProfileUpdate = () => {
      refreshUserProfile();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    // クリーンアップ関数
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [initialUser, refreshUserProfile]);

  // 初期値が変更された場合は状態を更新
  useEffect(() => {
    setCurrentUser(initialUser);
  }, [initialUser]);

  return (
    <header className="bg-white bg-opacity-95 backdrop-blur-sm shadow-sm z-50">
      <div className="px-6 sm:px-8 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href="/"
            className="text-lg font-medium text-gray-800 flex items-center"
          >
            <Image
              src="/icon0.webp"
              alt="ClippyMap icon"
              width={24}
              height={24}
              className="text-primary-500"
              priority
            />
            <span className="ml-2 sm:text-xl font-semibold font-quicksand">
              <span className="text-primary-600">ClippyMap</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex items-center space-x-6">
          {!isClient ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-24 hidden md:block" />
              <Skeleton className="h-8 w-36 hidden md:block" />
              <Skeleton className="h-8 w-36 hidden md:block" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ) : currentUser ? (
            <>
              {/* PC表示時のみヘッダーにマイリスト一覧を表示 */}
              <Link
                href="/lists"
                className="text-sm hidden md:flex items-center text-neutral-800 hover:text-neutral-900 transition"
              >
                マイリスト一覧
              </Link>
              {/* PC表示用のSubscriptionStatus & Upgrade Button */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="w-36">
                  <SubscriptionStatus
                    label="累計地点登録数" // "今月の地点登録数" → "累計地点登録数"
                    currentValue={registeredPlacesTotal} // プロパティ名変更
                    maxValue={maxPlaces}
                    loading={planLoading}
                  />
                </div>
                <div className="w-36">
                  <SubscriptionStatus
                    label="共有リスト数"
                    currentValue={sharedListCount}
                    maxValue={maxSharedLists}
                    loading={planLoading}
                  />
                </div>
                {subscriptionPlan === "free" && !planLoading && (
                  <UpgradePlanDialog />
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 outline-none focus:ring-2 focus:ring-primary-500 px-1 py-1 rounded-md hover:bg-neutral-100 transition">
                    <Avatar className="h-9 w-9 border border-neutral-300 flex items-center justify-center">
                      {currentUser.avatarUrl ? (
                        <AvatarImage
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                        />
                      ) : (
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-3">
                      {/* ユーザー情報 */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9 border border-neutral-300 flex items-center justify-center">
                          {currentUser.avatarUrl ? (
                            <AvatarImage
                              src={currentUser.avatarUrl}
                              alt={currentUser.name}
                            />
                          ) : (
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium leading-none">
                            {currentUser.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground pt-1.5">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>

                      {/* PC用プラン表示 (ドロップダウン内) */}
                      <div className="hidden md:block pt-1">
                        <p className="text-xs leading-none text-muted-foreground">
                          {planLoading ? "取得中..." : `現在のプラン：${plan}`}
                        </p>
                        {subscriptionPlan === "free" && !planLoading && (
                          <div className="pt-2">
                            <UpgradePlanDialog />
                          </div>
                        )}
                      </div>

                      {/* スマートフォン用プラン・ステータス表示 */}
                      <div className="md:hidden space-y-3">
                        <p className="text-xs leading-none text-muted-foreground">
                          {planLoading ? "取得中..." : `現在のプラン：${plan}`}
                        </p>
                        <div className="space-y-2">
                          <SubscriptionStatus
                            label="累計地点登録数" // "今月の地点登録数" → "累計地点登録数"
                            currentValue={registeredPlacesTotal} // プロパティ名変更
                            maxValue={maxPlaces}
                            loading={planLoading}
                          />
                          <SubscriptionStatus
                            label="共有リスト数"
                            currentValue={sharedListCount}
                            maxValue={maxSharedLists}
                            loading={planLoading}
                          />
                        </div>
                        {subscriptionPlan === "free" && !planLoading && (
                          <UpgradePlanDialog />
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* ドロップダウン内のマイリスト一覧はmd未満のみ表示 */}
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/lists">
                      <List className="mr-2 h-4 w-4" />
                      マイリスト一覧
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="text-gray-600">
                      <Settings className="mr-2 h-4 w-4" />
                      設定
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <form
                      action={onLogout}
                      className="w-full flex items-center text-red-600 hover:!text-red-700 focus:text-red-700 cursor-pointer"
                    >
                      <button
                        type="submit"
                        className="w-full flex items-center"
                      >
                        <LogOut className="mr-4 h-4 w-4" />
                        ログアウト
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                ログイン
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
