"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateRankingAction } from "@/lib/actions/rankingActions";
import { PlaceListGroup, RankedPlace, Place } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

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
          .map((p: Place) => {
            const existingRank = list.ranking?.find(
              (rp) => rp.placeId === p.id
            );
            return existingRank
              ? { ...existingRank }
              : { placeId: p.id, rank: 0, comment: "" }; // rank 0 は未ランク扱い
          })
          .sort((a: RankedPlace, b: RankedPlace) => {
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
            .map((p: Place) => {
              const existingRank = list.ranking?.find(
                (rp) => rp.placeId === p.id
              );
              return existingRank
                ? { ...existingRank }
                : { placeId: p.id, rank: 0, comment: "" };
            })
            .sort((a: RankedPlace, b: RankedPlace) => {
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
      .sort((a: RankedPlace, b: RankedPlace) => a.rank - b.rank)
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
      alert("ランキングの保存中に予期せぬエラーが発生しました。");
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
        <DialogHeader className="pr-6">
          <DialogTitle className="text-neutral-900 dark:text-neutral-50">
            ランキングを編集: {list.name}
          </DialogTitle>
          <DialogDescription className="text-neutral-500 dark:text-neutral-400">
            ランキングのタイトル、説明、各場所の順位やコメントを編集します。
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6 space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="rankingTitle"
                className="text-neutral-700 dark:text-neutral-300"
              >
                ランキングタイトル
              </Label>
              <Input
                id="rankingTitle"
                value={rankingTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRankingTitle(e.target.value)
                }
                placeholder="例：東京の絶景カフェランキング TOP5"
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="rankingDescription"
                className="text-neutral-700 dark:text-neutral-300"
              >
                ランキング説明（任意）
              </Label>
              <Textarea
                id="rankingDescription"
                value={rankingDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRankingDescription(e.target.value)
                }
                placeholder="このランキングについての簡単な説明を入力します。"
                className="mt-1"
              />
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700/60 pt-6 space-y-4">
            <h4 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              場所のランキングとコメント
            </h4>
            <div className="space-y-4">
              {currentPlaces.map((rp, index) => (
                <div
                  key={rp.placeId}
                  className="p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="font-medium truncate pr-2 text-neutral-800 dark:text-neutral-200"
                      title={getPlaceName(rp.placeId)}
                    >
                      {rp.rank > 0 ? rp.rank + "位: " : "ランク外: "}{" "}
                      {getPlaceName(rp.placeId)}
                    </span>
                    <div className="flex space-x-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveRank(rp.placeId, "up")}
                        disabled={
                          rp.rank === 0 ||
                          index === 0 ||
                          currentPlaces.filter((p) => p.rank > 0)[0]
                            ?.placeId === rp.placeId
                        }
                        className="h-8 w-8"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveRank(rp.placeId, "down")}
                        disabled={
                          rp.rank === 0 ||
                          index ===
                            currentPlaces.filter((p) => p.rank > 0).length -
                              1 ||
                          currentPlaces.filter((p) => p.rank > 0).pop()
                            ?.placeId === rp.placeId
                        }
                        className="h-8 w-8"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={rp.comment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleCommentChange(rp.placeId, e.target.value)
                    }
                    placeholder="コメント（任意）"
                    className="w-full text-sm"
                    rows={2}
                  />
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() =>
                      setCurrentPlaces(
                        currentPlaces.map((p) =>
                          p.placeId === rp.placeId ? { ...p, rank: 0 } : p
                        )
                      )
                    }
                    className="text-xs text-red-600 hover:text-red-700 mt-2 p-0 h-auto dark:text-red-500 dark:hover:text-red-400"
                    disabled={rp.rank === 0}
                  >
                    {rp.rank > 0 ? "ランク外にする" : "ランク外"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t pt-4 pr-6">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-neutral-700 dark:text-neutral-300"
            >
              キャンセル
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            {isSaving ? "保存中..." : "ランキングを保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
