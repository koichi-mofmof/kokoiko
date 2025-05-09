"use client";

import { useState, useEffect } from "react";
import { Place } from "@/types";
import { RankedPlace, PlaceListGroup } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateRankingAction } from "@/lib/actions/rankingActions"; // インポートを有効化

interface RankingEditModalProps {
  list: PlaceListGroup;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRankingUpdate: (updatedList: PlaceListGroup) => void; // 更新成功時に親コンポーネントに通知
}

export default function RankingEditModal({
  list,
  isOpen,
  onOpenChange,
  onRankingUpdate,
}: RankingEditModalProps) {
  const [rankingTitle, setRankingTitle] = useState(list.rankingTitle || "");
  const [rankingDescription, setRankingDescription] = useState(
    list.rankingDescription || ""
  );
  // list.places から RankedPlace[] を初期化。既存のrankingがあればそれを使う
  const initialRankedPlaces: RankedPlace[] =
    list.ranking && list.ranking.length > 0
      ? list.places
          .map((p) => {
            const existingRank = list.ranking?.find(
              (rp) => rp.placeId === p.id
            );
            return existingRank
              ? { ...existingRank }
              : { placeId: p.id, rank: 0, comment: "" }; // rank 0 は未ランク扱い
          })
          .sort((a, b) => {
            // 既存のrank順、なければ末尾
            const rankA =
              list.ranking?.find((r) => r.placeId === a.placeId)?.rank ||
              Infinity;
            const rankB =
              list.ranking?.find((r) => r.placeId === b.placeId)?.rank ||
              Infinity;
            return rankA - rankB;
          })
      : list.places.map((p, index) => ({
          placeId: p.id,
          rank: index + 1,
          comment: "",
        }));

  const [currentPlaces, setCurrentPlaces] =
    useState<RankedPlace[]>(initialRankedPlaces);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRankingTitle(list.rankingTitle || `素敵な${list.name}ランキング`);
    setRankingDescription(list.rankingDescription || "");
    // リストが変更されたら currentPlaces も更新
    const newInitialRankedPlaces: RankedPlace[] =
      list.ranking && list.ranking.length > 0
        ? list.places
            .map((p) => {
              const existingRank = list.ranking?.find(
                (rp) => rp.placeId === p.id
              );
              return existingRank
                ? { ...existingRank }
                : { placeId: p.id, rank: 0, comment: "" };
            })
            .sort((a, b) => {
              const rankA =
                list.ranking?.find((r) => r.placeId === a.placeId)?.rank ||
                Infinity;
              const rankB =
                list.ranking?.find((r) => r.placeId === b.placeId)?.rank ||
                Infinity;
              return rankA - rankB;
            })
        : list.places.map((p, index) => ({
            placeId: p.id,
            rank: index + 1,
            comment: "",
          }));
    setCurrentPlaces(newInitialRankedPlaces);
  }, [list]);

  const handleCommentChange = (placeId: string, comment: string) => {
    setCurrentPlaces(
      currentPlaces.map((p) => (p.placeId === placeId ? { ...p, comment } : p))
    );
  };

  // 簡単な順位入れ替え機能 (例: 上へ、下へボタン)
  const moveRank = (placeId: string, direction: "up" | "down") => {
    const currentIndex = currentPlaces.findIndex((p) => p.placeId === placeId);
    if (currentIndex === -1) return;

    const newPlaces = [...currentPlaces];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= newPlaces.length) return;

    // rank を入れ替え
    [newPlaces[currentIndex].rank, newPlaces[targetIndex].rank] = [
      newPlaces[targetIndex].rank,
      newPlaces[currentIndex].rank,
    ];
    // 配列要素を入れ替え
    [newPlaces[currentIndex], newPlaces[targetIndex]] = [
      newPlaces[targetIndex],
      newPlaces[currentIndex],
    ];

    setCurrentPlaces(newPlaces);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const finalRankedPlaces = currentPlaces
      .filter((p) => p.rank > 0)
      .sort((a, b) => a.rank - b.rank)
      .map((p, index) => ({ ...p, rank: index + 1 }));

    try {
      const result = await updateRankingAction(
        list.id,
        rankingTitle,
        rankingDescription,
        finalRankedPlaces
      );
      if (result && "id" in result) {
        // resultがPlaceListGroup型かチェック (エラーでないことを確認)
        onRankingUpdate(result);
        onOpenChange(false); // モーダルを閉じる
      } else {
        // result が { error: string } の場合
        console.error("Failed to update ranking:", result?.error);
        alert(
          `ランキングの保存に失敗しました: ${result?.error || "不明なエラー"}`
        );
      }
    } catch (error) {
      console.error("Error calling updateRankingAction:", error);
      // 一般的なエラーメッセージを表示 (ユーザーフレンドリーに)
      alert(`ランキングの保存中に予期せぬエラーが発生しました。`);
    } finally {
      setIsSaving(false);
    }
  };

  // 実際の場所名を表示するために使用
  const getPlaceName = (placeId: string) =>
    list.places.find((p) => p.id === placeId)?.name || "不明な場所";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>ランキングを編集: {list.name}</DialogTitle>
          <DialogDescription>
            ランキングのタイトル、説明、各場所の順位やコメントを編集します。
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2 space-y-4 py-2">
          <div>
            <Label htmlFor="rankingTitle">ランキングタイトル</Label>
            <Input
              id="rankingTitle"
              value={rankingTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRankingTitle(e.target.value)
              }
              placeholder="例：東京の絶景カフェランキング TOP5"
            />
          </div>
          <div>
            <Label htmlFor="rankingDescription">ランキング説明（任意）</Label>
            <Textarea
              id="rankingDescription"
              value={rankingDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRankingDescription(e.target.value)
              }
              placeholder="このランキングについての簡単な説明を入力します。"
            />
          </div>

          <h4 className="font-semibold pt-2">場所のランキングとコメント</h4>
          <div className="space-y-3">
            {currentPlaces.map((rp, index) => (
              <div
                key={rp.placeId}
                className="p-3 border rounded-md bg-slate-50/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-medium truncate pr-2"
                    title={getPlaceName(rp.placeId)}
                  >
                    {rp.rank > 0 ? `${rp.rank}位: ` : "ランク外: "}{" "}
                    {getPlaceName(rp.placeId)}
                  </span>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveRank(rp.placeId, "up")}
                      disabled={
                        rp.rank === 0 ||
                        index === 0 ||
                        currentPlaces.filter((p) => p.rank > 0)[0]?.placeId ===
                          rp.placeId
                      }
                    >
                      ↑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveRank(rp.placeId, "down")}
                      disabled={
                        rp.rank === 0 ||
                        index === currentPlaces.length - 1 ||
                        currentPlaces.filter((p) => p.rank > 0).slice(-1)[0]
                          ?.placeId === rp.placeId
                      }
                    >
                      ↓
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={rp.comment || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleCommentChange(rp.placeId, e.target.value)
                  }
                  placeholder="コメント（任意） 例：ここの景色が最高！"
                  rows={2}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>
              キャンセル
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "保存中..." : "ランキングを保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
