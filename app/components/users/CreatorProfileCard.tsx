"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicListForHome } from "@/lib/dal/public-lists";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { Trophy, MapPin, Calendar, Users } from "lucide-react";

interface CreatorProfileCardProps {
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  stats: {
    publicListCount: number;
    totalPlaceCount: number;
    totalViews?: number;
    memberSince: string;
  };
  recentLists: PublicListForHome[];
}

export function CreatorProfileCard({
  creator,
  stats,
  recentLists,
}: CreatorProfileCardProps) {
  const displayName = creator.displayName || creator.username;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={creator.avatarUrl || undefined}
              alt={displayName}
            />
            <AvatarFallback className="text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-2xl font-bold text-neutral-900">
                {displayName}
              </h2>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                <Trophy className="h-3 w-3 mr-1" />
                人気クリエイター
              </Badge>
            </div>
            <p className="text-neutral-600 mb-2">@{creator.username}</p>
            {creator.bio && (
              <p className="text-sm text-neutral-600">{creator.bio}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {stats.publicListCount}
            </div>
            <div className="text-sm text-neutral-600">公開リスト</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {stats.totalPlaceCount}
            </div>
            <div className="text-sm text-neutral-600">登録地点</div>
          </div>
          {stats.totalViews && (
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {stats.totalViews.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-600">総閲覧数</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-sm font-medium text-neutral-600">
              {formatDistanceToNow(new Date(stats.memberSince), {
                addSuffix: true,
                locale: ja,
              })}
            </div>
            <div className="text-sm text-neutral-600">メンバー歴</div>
          </div>
        </div>

        {/* 最近のリスト */}
        {recentLists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                最近のリスト
              </h3>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/users/${creator.id}`}>すべて見る</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentLists.slice(0, 4).map((list) => (
                <Link key={list.id} href={`/lists/${list.id}`}>
                  <div className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-neutral-900 line-clamp-2">
                        {list.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {list.placeCount}地点
                      </Badge>
                    </div>
                    {list.description && (
                      <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                        {list.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(list.updatedAt), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{list.placeCount}地点</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href={`/users/${creator.id}`}>
              <Users className="h-4 w-4 mr-2" />
              すべてのリストを見る
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/public-lists?creator=${creator.username}`}>
              このユーザーのリストを検索
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
