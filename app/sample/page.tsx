import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Avatar関連をインポート
import { Card, CardContent } from "@/components/ui/card"; // Import Card components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { mockPlaceLists, mockUsers } from "@/lib/mockData"; // Import mockUsers as well
import { List } from "lucide-react";
import Image from "next/image"; // Import next/image
import Link from "next/link";

// Sample Page (Server Component for List Overview)
export default async function SampleListPage() {
  const placeLists = mockPlaceLists;
  const allUsers = mockUsers; // Get all users from mock data
  const maxAvatars = 5; // 表示するアバターの最大数

  return (
    // Removed the outer container div, now handled by layout.tsx
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium text-neutral-900 flex items-center">
          <List className="h-6 w-6 text-primary-600 mr-2" />{" "}
          {/* Changed Icon */}
          リスト一覧
        </h1>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              const coverImageUrl = list.places?.[0]?.imageUrl; // Get image URL from first place if available

              return (
                <Link
                  key={list.id}
                  href={`/sample/${list.id}`}
                  className="block group"
                >
                  <Card className="overflow-hidden h-full flex flex-col transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1">
                    {/* Cover Image Section */}
                    <div className="relative w-full h-40 bg-neutral-200">
                      {" "}
                      {/* Fixed height container */}
                      {coverImageUrl ? (
                        <Image
                          src={coverImageUrl}
                          alt={`${list.name} Cover Image`}
                          fill // Use fill instead of layout
                          style={{ objectFit: "cover" }} // Use style for objectFit
                          className="transition-transform duration-300 ease-in-out group-hover:scale-105" // Subtle zoom on hover
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Add sizes attribute
                          priority={false} // Set priority based on use case, false for non-critical
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-300">
                          <List className="h-12 w-12 text-neutral-400" />{" "}
                          {/* Placeholder Icon */}
                        </div>
                      )}
                      {/* Optional: Overlay */}
                      {/* <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-0 transition-opacity"></div> */}
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-4 flex flex-col flex-grow">
                      {" "}
                      {/* Use flex-grow to push footer down */}
                      {/* Title and Description */}
                      <div className="mb-3">
                        <h2 className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-2 group-hover:text-primary-700">
                          {list.name}
                        </h2>
                        {list.description && (
                          <p className="text-sm text-neutral-600 line-clamp-2">
                            {list.description}
                          </p>
                        )}
                      </div>
                      {/* Spacer to push footer items down */}
                      <div className="flex-grow"></div>
                      {/* Avatars and Count (Footer equivalent) */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-100">
                        {/* Shared Avatars */}
                        <div className="flex items-center">
                          {sharedUsers.length > 0 ? (
                            <div className="flex overflow-hidden mr-2">
                              {displayedUsers.map((user) => (
                                <Tooltip key={user.id}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-white">
                                      <AvatarImage
                                        src={user.avatarUrl}
                                        alt={user.name}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {user.name?.charAt(0).toUpperCase() ||
                                          "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{user.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {remainingUsers > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-white">
                                      <AvatarFallback className="text-xs bg-neutral-200 text-neutral-600">
                                        +{remainingUsers}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>他 {remainingUsers} 人と共有中</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          ) : (
                            <div className="h-6"></div> // Placeholder for alignment if no users
                          )}
                        </div>

                        {/* Place Count */}
                        <p className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-700">
                          {list.places.length} 件
                        </p>
                      </div>
                    </CardContent>
                    {/* Optional: CardFooter could be used here */}
                  </Card>
                </Link>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </>
  );
}
