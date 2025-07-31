"use client";

import { updateDisplayOrders } from "@/lib/actions/place-display-orders";
import { DisplayOrderedPlace, Place } from "@/types";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React, { useEffect, useMemo, useState } from "react";
import { SortablePlaceItem } from "./SortablePlaceItem";

interface PlaceListProps {
  places: Place[];
  displayOrders: DisplayOrderedPlace[];
  listId: string;
  selectedPlaceId?: string;
  isSample?: boolean;
  permission?: "owner" | "edit" | "view";
  onDisplayOrderUpdate?: (newDisplayOrders: DisplayOrderedPlace[]) => void;
}
const PlaceList: React.FC<PlaceListProps> = ({
  places,
  displayOrders,
  listId,
  selectedPlaceId,
  isSample = false,
  permission = "view",
  onDisplayOrderUpdate,
}) => {
  const [localDisplayOrders, setLocalDisplayOrders] = useState<
    DisplayOrderedPlace[]
  >(displayOrders || []);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px移動でドラッグ開始（タッチスクロールとの区別）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 表示順序に基づいて場所をソート
  const sortedPlaces = useMemo(() => {
    if (!localDisplayOrders || localDisplayOrders.length === 0) {
      return places;
    }

    // 表示順序のマップを作成
    const orderMap = new Map(
      localDisplayOrders.map((order) => [order.placeId, order.displayOrder])
    );

    // 場所を表示順序でソート
    return [...places].sort((a, b) => {
      const orderA = orderMap.get(a.id) || 999;
      const orderB = orderMap.get(b.id) || 999;
      return orderA - orderB;
    });
  }, [places, localDisplayOrders]);

  // displayOrdersが更新されたら内部状態も更新
  useEffect(() => {
    setLocalDisplayOrders(displayOrders || []);
  }, [displayOrders]);

  // ドラッグ終了処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedPlaces.findIndex((place) => place.id === active.id);
    const newIndex = sortedPlaces.findIndex((place) => place.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 新しい順序を計算
    const reorderedPlaces = arrayMove(sortedPlaces, oldIndex, newIndex);
    const newDisplayOrders = reorderedPlaces.map((place, index) => ({
      placeId: place.id,
      displayOrder: index + 1,
    }));

    // 楽観的更新
    setLocalDisplayOrders(newDisplayOrders);

    // サーバーに更新を送信
    if (!isSample) {
      setIsUpdating(true);
      try {
        const result = await updateDisplayOrders({
          listId,
          displayOrders: newDisplayOrders,
        });

        if (result.error) {
          console.error("Failed to update display orders:", result.error);
          // エラー時は元の状態に戻す
          setLocalDisplayOrders(displayOrders);
        } else {
          // 成功時はコールバックを呼ぶ
          onDisplayOrderUpdate?.(newDisplayOrders);
        }
      } catch (error) {
        console.error("Error updating display orders:", error);
        // エラー時は元の状態に戻す
        setLocalDisplayOrders(displayOrders);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // 編集権限があるかチェック
  const canEdit = permission === "owner" || permission === "edit";
  const isDragDisabled = isSample || !canEdit || isUpdating;

  if (places.length === 0) {
    return (
      <div className="p-4 text-center text-neutral-500">
        登録された場所がありません
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedPlaces.map((place) => place.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2" data-testid="place-list">
          {sortedPlaces.map((place) => {
            const displayOrder =
              localDisplayOrders.find((order) => order.placeId === place.id)
                ?.displayOrder || 0;

            return (
              <SortablePlaceItem
                key={place.id}
                place={place}
                displayOrder={displayOrder}
                listId={listId}
                selectedPlaceId={selectedPlaceId}
                isSample={isSample}
                isDragDisabled={isDragDisabled}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default PlaceList;
