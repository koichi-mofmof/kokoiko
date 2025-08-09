"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { fetchRankingViewData } from "@/lib/actions/rankings";
import { Place, RankedPlace } from "@/types";
import { useEffect, useState } from "react";
import RankingDisplay from "./RankingDisplay";
import RankingEditModal from "./RankingEditModal";

interface RankingViewProps {
  listId: string;
  places?: Place[];
  permission?: string | null;
}

export default function RankingView({
  listId,
  places: parentPlaces,
  permission,
}: RankingViewProps) {
  const { t } = useI18n();
  const [ranking, setRanking] = useState<RankedPlace[]>([]);
  const [places, setPlaces] = useState<Place[]>(parentPlaces || []);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

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
  }, [listId, parentPlaces]);

  const handleRankingUpdate = async () => {
    setIsEditModalOpen(false);
    setIsLoading(true);
    setError(null);

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
    return <div>{t("common.loading")}</div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-soft border border-neutral-200 shadow-soft p-8 text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
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
          />
          {(permission === "edit" || permission === "owner") && (
            <div className="mt-6 text-center">
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="secondary"
              >
                {t("lists.ranking.edit")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground mb-4">
            {t("lists.ranking.notCreated")}
          </p>
          {(permission === "edit" || permission === "owner") && (
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="secondary"
            >
              {t("lists.ranking.create")}
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
