import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";

export default function SampleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Alert className="mb-4">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>サンプルデータを表示しています</AlertTitle>
        <AlertDescription className="text-neutral-900 items-center gap-1">
          自分の場所を登録・管理するには
          <Link href="/login" className="underline font-medium px-1">
            ログイン
          </Link>
          が必要です。
        </AlertDescription>
      </Alert>
      {/* Render the specific page content */}
      {children}
    </div>
  );
}
