import { mockPlaceLists, mockUsers } from "@/lib/mockData"; // Import mockUsers as well
import { List, Plus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Avatar関連をインポート
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Sample Page (Server Component for List Overview)
export default async function SampleListPage() {
  const placeLists = mockPlaceLists;
  const allUsers = mockUsers; // Get all users from mock data
  const maxAvatars = 3; // 表示するアバターの最大数

  return (
    // Removed the outer container div, now handled by layout.tsx
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium text-neutral-900 flex items-center">
          <List className="h-6 w-6 text-primary-600 mr-2" />{" "}
          {/* Changed Icon */}
          リスト一覧
        </h1>
        <Link
          href="/sample/new" // 仮: 新規リスト作成ページへ
          className="inline-flex items-center justify-center p-3 bg-primary-600 text-white rounded-full shadow-medium hover:bg-primary-700 hover:text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      {placeLists.length === 0 ? (
        <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
          <p className="text-neutral-600 mb-4">
            「行きたい場所リスト」がまだ作成されていません。
          </p>
        </div>
      ) : (
        <TooltipProvider>
          {" "}
          {/* TooltipProviderでラップ */}
          <div className="bg-white rounded-soft border border-neutral-200 shadow-soft overflow-hidden">
            <ul role="list" className="divide-y divide-neutral-200">
              {placeLists.map((list) => {
                // Get shared users based on list.sharedUserIds
                const sharedUsers = list.sharedUserIds
                  ? allUsers.filter((user) =>
                      list.sharedUserIds?.includes(user.id)
                    )
                  : []; // Default to empty array if no sharedUserIds

                // Apply the same display logic
                const displayedUsers = sharedUsers.slice(0, maxAvatars);
                const remainingUsers = sharedUsers.length - maxAvatars;

                return (
                  <li key={list.id}>
                    <Link
                      href={`/sample/${list.id}`}
                      className="block hover:bg-neutral-50 transition-colors"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between gap-x-2">
                          {" "}
                          {/* gapを追加 */}
                          {/* List Name */}
                          <p className="text-md font-medium text-primary-600 truncate mr-auto">
                            {" "}
                            {/* mr-autoを追加して左寄せ */}
                            {list.name}
                          </p>
                          {/* Shared Avatars & Count */}
                          <div className="ml-2 flex-shrink-0 flex items-center space-x-1">
                            {" "}
                            {/* アバターと件数を横並びに */}
                            {/* Avatars */}
                            {sharedUsers.length > 0 && ( // Use the filtered sharedUsers
                              <div className="flex -space-x-2 overflow-hidden">
                                {displayedUsers.map(
                                  (
                                    user // user type is inferred from allUsers
                                  ) => (
                                    <Tooltip key={user.id}>
                                      <TooltipTrigger asChild>
                                        <Avatar className="h-6 w-6 border-2 border-white">
                                          {""}
                                          {/* Sizes adjustment */}
                                          <AvatarImage
                                            src={user.avatarUrl} // Use avatarUrl from User type (needs to be added to type definition)
                                            alt={user.name}
                                          />
                                          <AvatarFallback className="text-xs">
                                            {""}
                                            {/* Fallback text size adjustment */}
                                            {user.name
                                              ?.charAt(0)
                                              .toUpperCase() || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{user.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )
                                )}
                                {remainingUsers > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-6 w-6 border-2 border-white">
                                        <AvatarFallback className="text-xs bg-neutral-200 text-neutral-600">
                                          {" "}
                                          {/* 残り表示用のスタイル */}+
                                          {remainingUsers}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>他 {remainingUsers} 人と共有中</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                            {/* Place Count */}
                            <p className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                              {list.places.length} 件
                            </p>
                          </div>
                        </div>
                        {list.description && (
                          <div className="mt-1">
                            <p className="text-sm text-neutral-500 line-clamp-1">
                              {list.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </TooltipProvider>
      )}
    </>
  );
}
