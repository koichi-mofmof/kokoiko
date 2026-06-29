import { sendGAEvent } from "@/app/components/analytics/GoogleAnalytics";

// 地図関連のイベント
export const trackMapEvents = {
  // 地図表示
  viewMap: (listId: string) => {
    sendGAEvent("view_map", "map_interaction", listId);
  },

  // 地点クリック
  clickPlace: (placeId: string) => {
    sendGAEvent("click_place", "map_interaction", placeId);
  },
};

// リスト関連のイベント
export const trackListEvents = {
  // リスト作成
  createList: () => {
    sendGAEvent("create_list", "list_management");
  },

  // リスト表示
  viewList: (listId: string) => {
    sendGAEvent("view_list", "list_engagement", listId);
  },

  // リスト共有
  shareList: (listId: string, shareMethod: "link" | "social") => {
    sendGAEvent("share_list", "list_engagement", `${listId}_${shareMethod}`);
  },

  // リスト編集
  editList: (listId: string) => {
    sendGAEvent("edit_list", "list_management", listId);
  },

  // リスト削除
  deleteList: (listId: string) => {
    sendGAEvent("delete_list", "list_management", listId);
  },

  // リストブックマーク
  bookmarkList: (listId: string) => {
    sendGAEvent("bookmark_list", "list_engagement", listId);
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

// 地点関連のイベント
export const trackPlaceEvents = {
  // 地点追加
  addPlace: (listId: string) => {
    sendGAEvent("add_place", "place_management", listId);
  },

  // 地点編集
  editPlace: (placeId: string) => {
    sendGAEvent("edit_place", "place_management", placeId);
  },

  // 地点削除
  deletePlace: (placeId: string) => {
    sendGAEvent("delete_place", "place_management", placeId);
  },

  // 地点詳細表示
  viewPlaceDetail: (placeId: string) => {
    sendGAEvent("view_place_detail", "place_engagement", placeId);
  },

  // 地点ランキング変更
  rankPlace: (placeId: string, rank: number) => {
    sendGAEvent("rank_place", "place_engagement", `${placeId}_${rank}`);
  },
};

// 検索関連のイベント
export const trackSearchEvents = {
  // 地点検索
  searchPlace: (query: string) => {
    sendGAEvent("search_place", "search", query);
  },

  // フィルタ使用
  useFilter: (filterType: string, filterValue: string) => {
    sendGAEvent("use_filter", "search", `${filterType}_${filterValue}`);
  },

  // 検索結果クリック
  clickSearchResult: (resultIndex: number) => {
    sendGAEvent("click_search_result", "search", resultIndex.toString());
  },
};

// テンプレコピー関連のイベント
export const trackTemplateCopyEvents = {
  // CTAボタン押下（モーダルを開く前）。ログイン状態で区別しファネル離脱を計測
  buttonClick: (sourceListId: string, isLoggedIn: boolean) => {
    sendGAEvent(
      "copy_button_click",
      "template_copy",
      `${sourceListId}_${isLoggedIn ? "member" : "guest"}`
    );
  },

  // コピー開始（モーダルでコピー実行）
  copyStart: (sourceListId: string) => {
    sendGAEvent("copy_list_start", "template_copy", sourceListId);
  },

  // コピー完了（コピーできた地点数を value として送信）
  copyComplete: (sourceListId: string, copiedCount: number) => {
    sendGAEvent("copy_list_complete", "template_copy", sourceListId, copiedCount);
  },
};

// 認証イベントの計測
// サーバーアクション/OAuthコールバックは成功時にサーバー側 redirect で遷移するため、
// フォーム内ではGA（window.gtag）を撃てない。リダイレクト先URLに付与した
// `auth_event` クエリパラメータをクライアント側で拾ってここで発火させる。
export function trackAuthEventFromParam(code: string): boolean {
  switch (code) {
    case "signup_email":
      trackUserEvents.signup("email");
      return true;
    case "signup_google":
      trackUserEvents.signup("google");
      return true;
    case "login_email":
      trackUserEvents.login("email");
      return true;
    case "login_google":
      trackUserEvents.login("google");
      return true;
    case "logout":
      trackUserEvents.logout();
      return true;
    default:
      return false;
  }
}

// コンバージョン関連のイベント
export const trackConversionEvents = {
  // ポップアップ表示
  promptShown: (listId: string, variant?: string) => {
    const eventValue = variant ? `${listId}_${variant}` : listId;
    sendGAEvent("signup_prompt_shown", "conversion", eventValue);
  },

  // ポップアップクリック
  promptClicked: (listId: string, variant?: string) => {
    const eventValue = variant ? `${listId}_${variant}` : listId;
    sendGAEvent("signup_prompt_clicked", "conversion", eventValue);
  },

  // ポップアップ閉じる
  promptDismissed: (listId: string, variant?: string) => {
    const eventValue = variant ? `${listId}_${variant}` : listId;
    sendGAEvent("signup_prompt_dismissed", "conversion", eventValue);
  },

  // バナーCTAボタン（サインアップ）クリック
  bannerCtaClicked: (listId: string) => {
    sendGAEvent("banner_cta_clicked", "conversion", listId);
  },

  // バナー詳細ボタンクリック
  bannerDetailClicked: (listId: string) => {
    sendGAEvent("banner_detail_clicked", "conversion", listId);
  },

  // バナー表示
  bannerShown: (listId: string) => {
    sendGAEvent("banner_shown", "conversion", listId);
  },

  // バナー閉じる
  bannerDismissed: (listId: string) => {
    sendGAEvent("banner_dismissed", "conversion", listId);
  },
};
