"use client"; // Client Component に変更

import { useState, useEffect } from "react"; // useState, useEffect をインポート
import { getPlaceListDetails, PlaceListGroup } from "@/lib/mockData"; // PlaceListGroup をインポート
import RankingDisplay from "./RankingDisplay";
import RankingEditModal from "./RankingEditModal"; // インポート
import { Button } from "@/components/ui/button";

interface RankingViewProps {
  listId: string;
}

export default function RankingView({ listId }: RankingViewProps) {
  // async を削除
  const [currentList, setCurrentList] = useState<PlaceListGroup | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true);
      const listData = await getPlaceListDetails(listId);
      if (listData) {
        setCurrentList(listData);
      }
      setIsLoading(false);
    };
    fetchList();
  }, [listId]);

  const handleRankingUpdate = (updatedList: PlaceListGroup) => {
    setCurrentList(updatedList); // モーダルから渡されたデータで更新
    // 必要であれば、ここで再度APIから最新データをフェッチすることも検討
  };

  if (isLoading) {
    return <div>読み込み中...</div>; // ローディング表示
  }

  if (!currentList) {
    return <div>リストが見つかりません。</div>;
  }

  const {
    ranking,
    rankingTitle,
    rankingDescription,
    places,
    name: listName,
  } = currentList;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">
        {rankingTitle || `${listName} のランキング`}
      </h2>
      {rankingDescription && (
        <p className="text-muted-foreground mb-6">{rankingDescription}</p>
      )}

      {ranking && ranking.length > 0 && places ? (
        <div>
          <RankingDisplay rankedPlaces={ranking} places={places} />
          <div className="mt-6 text-center">
            <Button onClick={() => setIsEditModalOpen(true)}>
              ランキングを編集
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            このリストにはまだランキングが作成されていません。
          </p>
          <Button onClick={() => setIsEditModalOpen(true)}>
            ランキングを作成
          </Button>
        </div>
      )}

      {isEditModalOpen && (
        <RankingEditModal
          list={currentList} // 最新のリストデータを渡す
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onRankingUpdate={handleRankingUpdate}
        />
      )}
    </div>
  );
}
