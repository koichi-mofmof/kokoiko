"use client";

import { Button } from "@/components/ui/button";
import { fetchRankingViewData } from "@/lib/actions/rankings";
import { getPlaceListDetails } from "@/lib/mockData";
import { Place, PlaceListGroup, RankedPlace } from "@/types";
import { useEffect, useState } from "react";
import RankingDisplay from "./RankingDisplay";
import RankingEditModal from "./RankingEditModal";

interface RankingViewProps {
  listId: string;
  places?: Place[];
  permission?: string;
}

export default function RankingView({
  listId,
  places: parentPlaces,
  permission,
}: RankingViewProps) {
  const [ranking, setRanking] = useState<RankedPlace[]>([]);
  const [places, setPlaces] = useState<Place[]>(parentPlaces || []);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mockList, setMockList] = useState<PlaceListGroup | null>(null);

  const isSample = listId.startsWith("sample-");

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      if (isSample) {
        // モックデータ利用
        const listData = await getPlaceListDetails(listId);
        if (!listData) {
          setError("リストが見つかりません");
          setIsLoading(false);
          return;
        }
        setMockList(listData);
        setRanking(listData.ranking || []);
        setPlaces(listData.places || []);
        setIsLoading(false);
        return;
      }
      // Supabaseデータ利用
      const result = await fetchRankingViewData(listId);
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setRanking(result.rankings || []);
      setPlaces(result.places || []);
      setIsLoading(false);
    };
    fetchData();
  }, [listId, parentPlaces, isSample]);

  const handleRankingUpdate = async () => {
    setIsEditModalOpen(false);
    setIsLoading(true);
    setError(null);
    if (isSample) {
      // モックデータ再取得
      const listData = await getPlaceListDetails(listId);
      if (!listData) {
        setError("リストが見つかりません");
        setIsLoading(false);
        return;
      }
      setMockList(listData);
      setRanking(listData.ranking || []);
      setPlaces(listData.places || []);
      setIsLoading(false);
      return;
    }
    // Supabaseデータ再取得
    const result = await fetchRankingViewData(listId);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    setRanking(result.rankings || []);
    setPlaces(result.places || []);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
      </div>
    );
  }

  // サンプル用モックデータ表示
  if (isSample && mockList) {
    return (
      <div className="p-4">
        {mockList.ranking && mockList.ranking.length > 0 && mockList.places ? (
          <RankingDisplay
            rankedPlaces={mockList.ranking}
            places={mockList.places}
            listId={listId}
            isSample={isSample}
          />
        ) : (
          <div className="text-center py-10">
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              このリストにはまだランキングが作成されていません。
            </p>
          </div>
        )}
      </div>
    );
  }

  // Supabaseデータ表示
  return (
    <div className="p-4">
      {ranking && ranking.length > 0 && places.length > 0 ? (
        <div>
          <RankingDisplay
            rankedPlaces={ranking}
            places={places}
            listId={listId}
            isSample={isSample}
          />
          {(permission === "edit" || permission === "owner") && (
            <div className="mt-6 text-center">
              <Button onClick={() => setIsEditModalOpen(true)}>
                ランキングを編集
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            このリストにはまだランキングが作成されていません。
          </p>
          {(permission === "edit" || permission === "owner") && (
            <Button onClick={() => setIsEditModalOpen(true)}>
              ランキングを作成
            </Button>
          )}
        </div>
      )}
      {isEditModalOpen && (
        <RankingEditModal
          list={{
            id: listId,
            name: "",
            description: "",
            ownerId: "",
            sharedUserIds: [],
            rankingTitle: "",
            rankingDescription: "",
            ranking: ranking,
            places,
          }}
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onRankingUpdate={handleRankingUpdate}
          mode={
            !(ranking && ranking.length > 0 && places.length > 0)
              ? "create"
              : "edit"
          }
        />
      )}
    </div>
  );
}
