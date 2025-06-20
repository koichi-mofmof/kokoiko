import { useOptimistic, useTransition } from "react";
import { OptimisticUpdateHelpers } from "@/lib/cloudflare/cdn-cache";

type OptimisticAction =
  | { type: "ADD_PLACE"; listId: string; place: any }
  | { type: "UPDATE_LIST"; listId: string; updates: any }
  | { type: "DELETE_PLACE"; listId: string; placeId: string }
  | { type: "REVERT"; key: string };

type OptimisticState = {
  [key: string]: {
    action: OptimisticAction;
    timestamp: number;
    pending: boolean;
  };
};

/**
 * 楽観的更新を管理するカスタムフック
 * ユーザーのアクションを即座にUIに反映し、サーバー処理完了後に同期
 */
export function useOptimisticUpdates() {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, addOptimistic] = useOptimistic<
    OptimisticState,
    OptimisticAction
  >({}, (state, action) => {
    const key = getActionKey(action);

    if (action.type === "REVERT") {
      const newState = { ...state };
      delete newState[action.key];
      return newState;
    }

    return {
      ...state,
      [key]: {
        action,
        timestamp: OptimisticUpdateHelpers.getTimestamp(),
        pending: true,
      },
    };
  });

  /**
   * 楽観的にリストを更新
   */
  const optimisticUpdateList = (
    listId: string,
    updates: any,
    serverAction: () => Promise<any>
  ) => {
    const key = OptimisticUpdateHelpers.getListUpdateKey(listId);

    startTransition(async () => {
      // 1. 即座にUIを更新
      addOptimistic({ type: "UPDATE_LIST", listId, updates });

      try {
        // 2. サーバーアクションを実行
        await serverAction();

        // 3. 成功時は楽観的更新を削除（サーバーデータで上書き）
        setTimeout(() => {
          addOptimistic({ type: "REVERT", key } as any);
        }, 100);
      } catch (error) {
        // 4. 失敗時は楽観的更新を取り消し
        addOptimistic({ type: "REVERT", key } as any);
        throw error;
      }
    });
  };

  /**
   * 楽観的に場所を追加
   */
  const optimisticAddPlace = (
    listId: string,
    place: any,
    serverAction: () => Promise<any>
  ) => {
    const key = OptimisticUpdateHelpers.getPlaceUpdateKey(listId, place.id);

    startTransition(async () => {
      addOptimistic({ type: "ADD_PLACE", listId, place });

      try {
        await serverAction();
        setTimeout(() => {
          addOptimistic({ type: "REVERT", key } as any);
        }, 100);
      } catch (error) {
        addOptimistic({ type: "REVERT", key } as any);
        throw error;
      }
    });
  };

  /**
   * 楽観的に場所を削除
   */
  const optimisticDeletePlace = (
    listId: string,
    placeId: string,
    serverAction: () => Promise<any>
  ) => {
    const key = OptimisticUpdateHelpers.getPlaceUpdateKey(listId, placeId);

    startTransition(async () => {
      addOptimistic({ type: "DELETE_PLACE", listId, placeId });

      try {
        await serverAction();
        setTimeout(() => {
          addOptimistic({ type: "REVERT", key } as any);
        }, 100);
      } catch (error) {
        addOptimistic({ type: "REVERT", key } as any);
        throw error;
      }
    });
  };

  return {
    optimisticState,
    isPending,
    optimisticUpdateList,
    optimisticAddPlace,
    optimisticDeletePlace,
  };
}

function getActionKey(action: OptimisticAction): string {
  switch (action.type) {
    case "UPDATE_LIST":
      return OptimisticUpdateHelpers.getListUpdateKey(action.listId);
    case "ADD_PLACE":
      return OptimisticUpdateHelpers.getPlaceUpdateKey(
        action.listId,
        action.place.id || "temp"
      );
    case "DELETE_PLACE":
      return OptimisticUpdateHelpers.getPlaceUpdateKey(
        action.listId,
        action.placeId
      );
    default:
      return "unknown";
  }
}
