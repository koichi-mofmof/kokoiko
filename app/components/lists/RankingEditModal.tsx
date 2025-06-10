"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { saveRankingViewData } from "@/lib/actions/rankings";
import { PlaceListGroup } from "@/types";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

interface RankingEditModalProps {
  list: PlaceListGroup;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRankingUpdate: (updatedList: PlaceListGroup) => void;
  mode?: "create" | "edit";
}

export default function RankingEditModal({
  list,
  isOpen,
  onOpenChange,
  onRankingUpdate,
  mode = "edit",
}: RankingEditModalProps) {
  // ランキング件数選択用ステート
  const [rankingCount, setRankingCount] = useState<number>(
    list.ranking?.length || 3
  );
  const [customRankingCount, setCustomRankingCount] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [rankingTargetIds, setRankingTargetIds] = useState<string[]>([]);
  // コメント管理用
  const [rankingComments, setRankingComments] = useState<{
    [placeId: string]: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  // dnd-kit sensorsは必ずトップレベルで呼び出す
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (isOpen) {
      // 既存ランキングがあれば反映
      if (list.ranking && list.ranking.length > 0) {
        const newRankingTargetIds = list.ranking.map((rp) => rp.placeId);
        setRankingTargetIds(newRankingTargetIds);

        const newRankingComments = Object.fromEntries(
          list.ranking.map((rp) => [rp.placeId, rp.comment || ""])
        );
        setRankingComments(newRankingComments);

        // 初期値で設定済のため、ここではcustomRankingCountのみ更新
        if (![3, 5, 10].includes(list.ranking.length)) {
          setCustomRankingCount(String(list.ranking.length));
        } else {
          setCustomRankingCount(""); // 3,5,10の場合はカスタムをクリア
        }
        // rankingCountが初期値と異なる場合のみ更新（基本的には不要なはず）
        if (rankingCount !== list.ranking.length) {
          setRankingCount(list.ranking.length);
        }
      } else {
        setRankingTargetIds([]);
        setRankingComments({});
        setRankingCount(3); // 新規作成時は3件
        setCustomRankingCount("");
      }
    }
  }, [isOpen, list, list.ranking]);

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いているときのみ実行
      setRankingTargetIds((prev) => {
        const newIds =
          prev.length > rankingCount ? prev.slice(0, rankingCount) : prev;
        return newIds;
      });
    }
  }, [rankingCount, isOpen]);

  const handleSubmit = async () => {
    setIsSaving(true);
    // 並び順・コメントを反映したRankedPlace[]を生成
    const finalRankedPlaces = rankingTargetIds.map((placeId, idx) => ({
      placeId,
      rank: idx + 1,
      comment: rankingComments[placeId] || "",
    }));
    try {
      const result = await saveRankingViewData({
        listId: list.id,
        rankedPlaces: finalRankedPlaces,
      });
      if (result && result.success) {
        onRankingUpdate(list); // UIリロード用
        onOpenChange(false);
      } else {
        console.error("Failed to update ranking:", result?.error);
        alert(
          `ランキングの保存に失敗しました: ${result?.error || "不明なエラー"}`
        );
      }
    } catch (error) {
      console.error("Error calling saveRankingViewData:", error);
      alert("ランキングの保存中に予期せぬエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToRanking = (placeId: string) => {
    if (!rankingTargetIds.includes(placeId)) {
      setRankingTargetIds([...rankingTargetIds, placeId]);
    }
  };

  const handleRemoveRankingTarget = (placeId: string) => {
    const newRankingTargetIds = rankingTargetIds.filter((id) => id !== placeId);
    setRankingTargetIds(newRankingTargetIds);
  };

  const handleRankingCommentChange = (placeId: string, comment: string) => {
    setRankingComments((prev) => ({ ...prev, [placeId]: comment }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] mx-auto max-h-[80vh] overflow-y-auto flex flex-col">
        <DialogHeader className="pr-6 border-b pb-4">
          <DialogTitle className="text-neutral-900 dark:text-neutral-50">
            {mode === "create" ? "ランキングを作成" : "ランキングを編集"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {mode === "create"
              ? "各場所の順位やコメントを設定してください。"
              : "各場所の順位やコメントを編集してください。"}
          </DialogDescription>
        </DialogHeader>
        {/* ランキング件数選択UI */}
        <div className="mb-4 px-2 text-neutral-800">
          <div className="font-semibold mb-2 dark:text-neutral-200">
            ランキング件数を選択
          </div>
          <RadioGroup
            value={
              [3, 5, 10].includes(rankingCount) && customRankingCount === ""
                ? String(rankingCount)
                : "custom"
            }
            onValueChange={(val) => {
              if (["3", "5", "10"].includes(val)) {
                const newRankCount = Number(val);
                setRankingCount(newRankCount);
                setCustomRankingCount(""); // 「その他」ではないのでカスタム件数はクリア
              } else if (val === "custom") {
                // 「その他」が選択された場合
                let targetCustomCount = customRankingCount;
                // customRankingCountが空か、現在のrankingCountが3,5,10のいずれかで、それがcustomRankingCountと一致しない場合
                // (例: ベスト5選択中 -> その他へ。この時 rankingCount は 5)
                if (
                  !targetCustomCount ||
                  ([3, 5, 10].includes(rankingCount) &&
                    String(rankingCount) !== targetCustomCount)
                ) {
                  targetCustomCount = String(rankingCount); // 現在のrankingCountをcustomとして引き継ぐ
                  setCustomRankingCount(targetCustomCount);
                }
                const newRankCount = Number(targetCustomCount) || 1; // 引き継いだ値 or 既存のcustom値。0件は許容しない
                setRankingCount(newRankCount);
              }
            }}
            className="flex flex-col sm:flex-row sm:gap-6 sm:items-center"
          >
            <div className="flex flex-row gap-4">
              <div className="flex items-center gap-1">
                <RadioGroupItem value="3" id="best3" />
                <label htmlFor="best3" className="mr-2 text-sm">
                  ベスト3
                </label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="5" id="best5" />
                <label htmlFor="best5" className="mr-2 text-sm">
                  ベスト5
                </label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="10" id="best10" />
                <label htmlFor="best10" className="mr-2 text-sm">
                  ベスト10
                </label>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 sm:mt-0">
              <RadioGroupItem value="custom" id="custom" />
              <label htmlFor="custom" className="mr-2 text-sm">
                その他
              </label>
              <Input
                type="number"
                min={1}
                max={list.places.length}
                value={customRankingCount}
                onChange={(e) => {
                  const newCustomValue = e.target.value;
                  setCustomRankingCount(newCustomValue);
                  const newRankCount = Number(newCustomValue) || 1; // 0件は許容しない
                  setRankingCount(newRankCount);
                  console.log(
                    `Input onChange: customRankingCount set to: ${newCustomValue}, rankingCount set to: ${newRankCount}`
                  );
                }}
                className="w-20 h-8 text-xs ml-1"
                disabled={false}
              />
              <span className="text-xs ml-1">件</span>
            </div>
          </RadioGroup>
        </div>
        {/* ランキング対象選択UI */}
        <div className="mb-4 px-2 text-neutral-800">
          <div className="font-semibold mb-2 dark:text-neutral-200">
            ランキング対象を選択
          </div>
          <Input
            type="text"
            placeholder="地点名で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 w-full max-w-xs"
          />
          <div className="max-h-40 sm:max-h-60 overflow-y-auto border rounded bg-neutral-50 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700/60 p-2">
            {(searchQuery
              ? list.places.filter(
                  (p) =>
                    p.name.includes(searchQuery) &&
                    !rankingTargetIds.includes(p.id)
                )
              : list.places.filter((p) => !rankingTargetIds.includes(p.id))
            ).length === 0 ? (
              <div className="text-sm text-neutral-400">
                該当する地点がありません
              </div>
            ) : (
              (searchQuery
                ? list.places.filter(
                    (p) =>
                      p.name.includes(searchQuery) &&
                      !rankingTargetIds.includes(p.id)
                  )
                : list.places.filter((p) => !rankingTargetIds.includes(p.id))
              ).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/40 rounded"
                >
                  <span className="truncate text-sm">{p.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 px-2 py-1 text-xs"
                    onClick={() => handleAddToRanking(p.id)}
                    disabled={
                      rankingTargetIds.includes(p.id) ||
                      rankingTargetIds.length >= rankingCount
                    }
                    data-testid="add-to-ranking"
                  >
                    追加
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            ※最大{rankingCount}件まで追加できます。
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            {rankingTargetIds.length >= rankingCount && (
              <span className="text-destructive ml-2">
                最大件数に達しています。
              </span>
            )}
          </div>
        </div>
        {/* ランキング対象リスト（追加済み地点） */}
        <div className="mb-4 px-2 text-neutral-800">
          <div className="font-semibold mb-2 dark:text-neutral-200">
            ランキング対象リスト
          </div>
          {rankingTargetIds.length === 0 ? (
            <div className="text-sm text-neutral-400">
              まだ地点が追加されていません
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (active.id !== over?.id) {
                  const oldIndex = rankingTargetIds.indexOf(
                    active.id as string
                  );
                  const newIndex = rankingTargetIds.indexOf(over?.id as string);
                  if (oldIndex !== -1 && newIndex !== -1) {
                    setRankingTargetIds((items) =>
                      arrayMove(items, oldIndex, newIndex)
                    );
                  }
                }
              }}
            >
              <SortableContext
                items={rankingTargetIds}
                strategy={verticalListSortingStrategy}
              >
                <Accordion type="multiple" className="space-y-2">
                  {rankingTargetIds.map((placeId, idx) => {
                    const place = list.places.find((p) => p.id === placeId);
                    if (!place) return null;
                    return (
                      <SortableRankingItem
                        key={placeId}
                        id={placeId}
                        idx={idx}
                        place={place}
                        rankingComments={rankingComments}
                        onRankingCommentChange={handleRankingCommentChange}
                        onMoveUp={() =>
                          idx > 0 &&
                          setRankingTargetIds((items) =>
                            arrayMove(items, idx, idx - 1)
                          )
                        }
                        onMoveDown={() =>
                          idx < rankingTargetIds.length - 1 &&
                          setRankingTargetIds((items) =>
                            arrayMove(items, idx, idx + 1)
                          )
                        }
                        onRemove={() => handleRemoveRankingTarget(placeId)}
                      />
                    );
                  })}
                </Accordion>
              </SortableContext>
            </DndContext>
          )}
        </div>
        <DialogFooter className="border-t pt-4 gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
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
            {isSaving
              ? mode === "create"
                ? "作成中..."
                : "保存中..."
              : mode === "create"
              ? "ランキングを作成"
              : "ランキングを保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortableRankingItem({
  id,
  idx,
  place,
  rankingComments,
  onRankingCommentChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  id: string;
  idx: number;
  place: { id: string; name: string };
  rankingComments: { [placeId: string]: string };
  onRankingCommentChange: (placeId: string, comment: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div
      className="relative"
      ref={setNodeRef}
      style={style}
      {...attributes}
      data-testid={`ranking-item-${idx}`}
    >
      <AccordionItem
        value={id}
        className="border rounded bg-neutral-50 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700/60"
      >
        <div className="flex flex-row items-center px-3 py-2 gap-2 w-full">
          <span className="font-medium text-sm flex-shrink-0">{idx + 1}位</span>
          <span className="truncate text-sm min-w-0">{place.name}</span>
          <div className="flex flex-row gap-1 flex-shrink-0 ml-auto items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={onMoveUp}
              disabled={idx === 0}
              tabIndex={-1}
              data-testid={`move-up-${idx}`}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={onMoveDown}
              disabled={idx === undefined}
              tabIndex={-1}
              data-testid={`move-down-${idx}`}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
              onClick={onRemove}
              tabIndex={-1}
            >
              ×
            </Button>
          </div>
        </div>
        <div className="px-3 pb-2">
          <AccordionTrigger className="text-xs px-2 py-1 border rounded bg-white dark:bg-neutral-900/40 border-neutral-300 dark:border-neutral-700 w-full sm:w-auto mt-2">
            {rankingComments[id] ? "コメントあり" : "コメントを書く"}
          </AccordionTrigger>
        </div>
        <AccordionContent className="px-3 pb-3">
          <Textarea
            value={rankingComments[id] || ""}
            onChange={(e) => onRankingCommentChange(id, e.target.value)}
            placeholder="コメント（任意）"
            className="w-full"
            rows={2}
          />
        </AccordionContent>
      </AccordionItem>
      <span
        {...listeners}
        className="cursor-move select-none text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 absolute left-[-24px] top-1/2 -translate-y-1/2"
        aria-label="ドラッグで並び替え"
        tabIndex={0}
        style={{
          userSelect: "none",
          background: "transparent",
          border: "none",
          boxShadow: "none",
          fontSize: "1.3em",
          lineHeight: 1,
          padding: 0,
        }}
      >
        ≡
      </span>
    </div>
  );
}
