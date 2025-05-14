import { http, HttpResponse } from "msw";

// モックユーザーデータ
const mockUsers = [
  {
    id: "user-1",
    email: "test@example.com",
    profile: {
      avatar_url: "/images/avatar-placeholder.png",
      username: "テストユーザー",
    },
  },
];

// モックリストデータ
const mockLists = [
  {
    id: "list-1",
    name: "テストリスト1",
    description: "テスト用のリストです",
    created_at: "2023-01-01T00:00:00Z",
    user_id: "user-1",
    thumbnail_url: "/images/list-placeholder.jpg",
  },
];

// モック場所データ
const mockPlaces = [
  {
    id: "place-1",
    name: "テスト場所1",
    address: "東京都渋谷区",
    lat: 35.658,
    lng: 139.7016,
    place_id: "google-place-id-1",
    prefecture: "東京都",
    tags: ["グルメ", "カフェ"],
    visited: true,
  },
];

export const handlers = [
  // 認証関連ハンドラー
  http.post("*/auth/v1/token", () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      user: mockUsers[0],
    });
  }),

  http.post("*/auth/v1/logout", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ユーザープロフィール関連ハンドラー
  http.get("*/rest/v1/profiles", () => {
    return HttpResponse.json({
      data: [mockUsers[0].profile],
    });
  }),

  http.patch("*/rest/v1/profiles", async ({ request }) => {
    const updatedProfile = await request.json();
    return HttpResponse.json({
      data: { ...mockUsers[0].profile, ...updatedProfile },
    });
  }),

  // リスト関連ハンドラー
  http.get("*/rest/v1/lists", () => {
    return HttpResponse.json({
      data: mockLists,
    });
  }),

  http.get("*/rest/v1/lists/:id", ({ params }) => {
    const { id } = params;
    const list = mockLists.find((list) => list.id === id);

    if (!list) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      data: list,
    });
  }),

  // 場所関連ハンドラー
  http.get("*/rest/v1/places", () => {
    return HttpResponse.json({
      data: mockPlaces,
    });
  }),

  // Supabaseのストレージモック
  http.get("*/storage/v1/object/public/*", () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // その他のAPIリクエストは404にする
  http.all("*", ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`);
    return new HttpResponse(null, { status: 404 });
  }),
];
