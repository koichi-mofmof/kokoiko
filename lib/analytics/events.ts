import { sendGAEvent } from "@/app/components/analytics/GoogleAnalytics";

// リスト関連のイベント
export const trackListEvents = {
  // リスト作成
  createList: (listName: string, isPublic: boolean) => {
    sendGAEvent("create_list", "engagement", listName, isPublic ? 1 : 0);
  },

  // リスト表示
  viewList: (listId: string, listName: string) => {
    sendGAEvent("view_list", "engagement", `${listId}-${listName}`);
  },

  // リスト共有
  shareList: (listId: string, shareMethod: string) => {
    sendGAEvent("share_list", "engagement", `${listId}-${shareMethod}`);
  },

  // リスト削除
  deleteList: (listId: string) => {
    sendGAEvent("delete_list", "engagement", listId);
  },
};

// 場所関連のイベント
export const trackPlaceEvents = {
  // 場所追加
  addPlace: (listId: string, placeName: string) => {
    sendGAEvent("add_place", "engagement", `${listId}-${placeName}`);
  },

  // 場所表示
  viewPlace: (placeId: string, placeName: string) => {
    sendGAEvent("view_place", "engagement", `${placeId}-${placeName}`);
  },

  // 場所編集
  editPlace: (placeId: string) => {
    sendGAEvent("edit_place", "engagement", placeId);
  },

  // 場所削除
  deletePlace: (placeId: string) => {
    sendGAEvent("delete_place", "engagement", placeId);
  },

  // Google Maps で開く
  openInGoogleMaps: (placeId: string, placeName: string) => {
    sendGAEvent("open_google_maps", "engagement", `${placeId}-${placeName}`);
  },
};

// ユーザー関連のイベント
export const trackUserEvents = {
  // サインアップ
  signup: (method: "email" | "google") => {
    sendGAEvent("sign_up", "user_auth", method);
  },

  // ログイン
  login: (method: "email" | "google") => {
    sendGAEvent("login", "user_auth", method);
  },

  // ログアウト
  logout: () => {
    sendGAEvent("logout", "user_auth");
  },

  // プロフィール更新
  updateProfile: () => {
    sendGAEvent("update_profile", "user_engagement");
  },
};

// UI/UX関連のイベント
export const trackUIEvents = {
  // 検索実行
  search: (query: string, resultsCount: number) => {
    sendGAEvent("search", "engagement", query, resultsCount);
  },

  // フィルター使用
  useFilter: (filterType: string, filterValue: string) => {
    sendGAEvent("use_filter", "engagement", `${filterType}-${filterValue}`);
  },

  // ビュー切り替え（地図/リスト）
  toggleView: (viewType: "map" | "list") => {
    sendGAEvent("toggle_view", "engagement", viewType);
  },

  // ランキング編集
  editRanking: (listId: string) => {
    sendGAEvent("edit_ranking", "engagement", listId);
  },
};

// エラー関連のイベント
export const trackErrorEvents = {
  // API エラー
  apiError: (endpoint: string, errorCode: string) => {
    sendGAEvent("api_error", "error", `${endpoint}-${errorCode}`);
  },

  // 認証エラー
  authError: (errorType: string) => {
    sendGAEvent("auth_error", "error", errorType);
  },

  // フォームエラー
  formError: (formName: string, errorType: string) => {
    sendGAEvent("form_error", "error", `${formName}-${errorType}`);
  },
};

// パフォーマンス関連のイベント
export const trackPerformanceEvents = {
  // ページロード時間
  pageLoadTime: (pageName: string, loadTime: number) => {
    sendGAEvent("page_load_time", "performance", pageName, loadTime);
  },

  // API レスポンス時間
  apiResponseTime: (endpoint: string, responseTime: number) => {
    sendGAEvent("api_response_time", "performance", endpoint, responseTime);
  },
};
