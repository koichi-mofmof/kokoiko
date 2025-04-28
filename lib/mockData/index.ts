import { Place, User } from "@/types";

// --- Mock Users --- (Define users first to use their IDs)
export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Alice Smith",
    email: "test@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=user-1",
  },
  {
    id: "user-2",
    name: "Bob Johnson",
    email: "yamada@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=user-2",
  },
  {
    id: "user-3",
    name: "Charlie Brown",
    email: "sato@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=user-3",
  },
  {
    id: "user-4",
    name: "David Williams",
    email: "ito@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=user-4",
  },
  {
    id: "user-5",
    name: "Evan Davis",
    email: "watanabe@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=user-5",
  },
];

// --- Mock Places Data ---
// (Using realistic place names and approximate locations in Tokyo)
export const mockPlaces: Place[] = [
  // Existing Date Spots (Indices 10-11)
  {
    id: "date-spot-001",
    name: "彫刻の森美術館",
    address: "神奈川県足柄下郡箱根町ニノ平1121",
    googleMapsUrl: "https://maps.app.goo.gl/rj3EVEiGCzv4pMjc9",
    latitude: 35.2482,
    longitude: 139.0484,
    notes: "自然の中でアートを楽しめる。ピカソ館も必見。",
    tags: ["美術館", "アート", "自然"],
    createdAt: new Date("2024-04-01T10:00:00Z"),
    updatedAt: new Date("2024-04-01T10:00:00Z"),
    visited: false,
    createdBy: mockUsers[0].id,
    rating: 5,
    googlePlaceId: "ChIJ9ZI1kZJ8GGARiT4eW9f0x3o",
  },
  {
    id: "date-spot-002",
    name: "横浜中華街",
    address: "神奈川県横浜市中区山下町",
    googleMapsUrl: "https://maps.app.goo.gl/CtKEqyHbVFai2d7g6",
    latitude: 35.4437,
    longitude: 139.6444,
    notes: "食べ歩きや中華料理が楽しい。異国情緒あふれる街並み。",
    tags: ["中華街", "グルメ", "食べ歩き"],
    createdAt: new Date("2024-05-10T12:00:00Z"),
    updatedAt: new Date("2024-05-10T12:00:00Z"),
    visited: false,
    createdBy: mockUsers[1].id,
    rating: 4,
    googlePlaceId: "ChIJN8zS-kGWGGARn5lIbmoV80Q",
  },
  // Additional Date Spots (Indices 12-19)
  {
    id: "date-spot-003",
    name: "江の島",
    address: "神奈川県藤沢市江の島",
    googleMapsUrl: "https://maps.app.goo.gl/m1BRs44mGpAMWAEK8",
    latitude: 35.3014,
    longitude: 139.4817,
    notes: "シーキャンドルからの眺めが最高。水族館や岩屋も楽しめる。",
    tags: ["観光地", "海", "展望台", "水族館"],
    createdAt: new Date("2024-06-01T11:00:00Z"),
    updatedAt: new Date("2024-06-01T11:00:00Z"),
    visited: false,
    createdBy: mockUsers[0].id,
    rating: 4,
    googlePlaceId: "ChIJcQfQ3kKFGGAREk8y3mI-B9k",
  },
  {
    id: "date-spot-004",
    name: "国営ひたち海浜公園",
    address: "茨城県ひたちなか市馬渡字大沼605-4",
    googleMapsUrl: "https://maps.app.goo.gl/BvWFUBZZq93C614FA",
    latitude: 36.4047,
    longitude: 140.5916,
    notes: "ネモフィラやコキアの絶景が有名。季節の花々が楽しめる。",
    tags: ["公園", "花畑", "絶景"],
    createdAt: new Date("2024-06-10T10:30:00Z"),
    updatedAt: new Date("2024-06-10T10:30:00Z"),
    visited: false,
    createdBy: mockUsers[1].id,
    rating: 5,
    googlePlaceId: "ChIJgUBK7_K9ImARt7rM2G37L9o",
  },
  {
    id: "date-spot-005",
    name: "マザー牧場",
    address: "千葉県富津市田倉940-3",
    googleMapsUrl: "https://maps.app.goo.gl/ZZ7q7tCBS6cFeodu6",
    latitude: 35.1895,
    longitude: 139.9487,
    notes: "動物とのふれあいや味覚狩り、花畑など一日中楽しめる。",
    tags: ["牧場", "動物", "自然", "味覚狩り"],
    createdAt: new Date("2024-07-01T09:00:00Z"),
    updatedAt: new Date("2024-07-01T09:00:00Z"),
    visited: false,
    createdBy: mockUsers[0].id,
    rating: 4,
    googlePlaceId: "ChIJm5_zL0iAImARJ4i_9Z1C0kU",
  },
  {
    id: "date-spot-006",
    name: "東京ドイツ村",
    address: "千葉県袖ケ浦市永吉419",
    googleMapsUrl: "https://maps.app.goo.gl/1SRfJKJFciafECBE7",
    latitude: 35.4483,
    longitude: 139.9952,
    notes: "広大な敷地で遊べる。冬のイルミネーションが特に有名。",
    tags: ["テーマパーク", "イルミネーション", "自然"],
    createdAt: new Date("2024-07-15T15:00:00Z"),
    updatedAt: new Date("2024-07-15T15:00:00Z"),
    visited: false,
    createdBy: mockUsers[1].id,
    rating: 4,
    googlePlaceId: "ChIJq9q-S9SAImARZ2Lw0C5D0F8",
  },
  {
    id: "date-spot-007",
    name: "三鷹の森ジブリ美術館",
    address: "東京都三鷹市下連雀1-1-83",
    googleMapsUrl: "https://maps.app.goo.gl/eq5df1pVHto4TsrM6",
    latitude: 35.6963,
    longitude: 139.5703,
    notes: "ジブリの世界観に浸れる。完全予約制なので注意。",
    tags: ["美術館", "ジブリ", "アニメ"],
    createdAt: new Date("2024-08-01T14:00:00Z"),
    updatedAt: new Date("2024-08-01T14:00:00Z"),
    visited: false,
    createdBy: mockUsers[0].id,
    rating: 5,
    googlePlaceId: "ChIJsZ-C21T9GGAR7r0ZtU9v1zQ",
  },
  {
    id: "date-spot-008",
    name: "よみうりランド",
    address: "東京都稲城市矢野口4015-1",
    googleMapsUrl: "https://maps.app.goo.gl/VrzNZtgtqYnJJpFd6",
    latitude: 35.6354,
    longitude: 139.5199,
    notes: "アトラクションやプール、冬はジュエルミネーションが楽しめる。",
    tags: ["遊園地", "イルミネーション", "プール"],
    createdAt: new Date("2024-08-15T10:00:00Z"),
    updatedAt: new Date("2024-08-15T10:00:00Z"),
    visited: false,
    createdBy: mockUsers[1].id,
    rating: 4,
    googlePlaceId: "ChIJ_c9Z2Tj4GGARf-5I9T5W0tI",
  },
  {
    id: "date-spot-009",
    name: "サンシャイン水族館",
    address:
      "東京都豊島区東池袋3-1 サンシャインシティ ワールドインポートマートビル 屋上",
    googleMapsUrl: "https://maps.app.goo.gl/Dwpprqd5or9Z2cp66",
    latitude: 35.7293,
    longitude: 139.719,
    notes: "天空のペンギンが人気。都会のオアシス。",
    tags: ["水族館", "動物"],
    createdAt: new Date("2024-09-01T13:00:00Z"),
    updatedAt: new Date("2024-09-01T13:00:00Z"),
    visited: false,
    createdBy: mockUsers[0].id,
    rating: 4,
    googlePlaceId: "ChIJ4fyhqtuMGGARr36dO0Y6kL8",
  },
  {
    id: "date-spot-010",
    name: "川越氷川神社",
    address: "埼玉県川越市宮下町2-11-3",
    googleMapsUrl: "https://maps.app.goo.gl/fVW2RN3NzXCGP3QY6",
    latitude: 35.9242,
    longitude: 139.4868,
    notes: "縁結びのパワースポットとして有名。風鈴祭りも人気。",
    tags: ["神社", "縁結び", "パワースポット"],
    createdAt: new Date("2024-09-15T11:00:00Z"),
    updatedAt: new Date("2024-09-15T11:00:00Z"),
    visited: false,
    createdBy: mockUsers[1].id,
    rating: 4,
    googlePlaceId: "ChIJq-lB5-GfGGARf-pE7z9c6QY",
  },
  // Osaka Spots (Indices 20-26)
  {
    id: "osaka-spot-001",
    name: "大阪城",
    address: "大阪府大阪市中央区大阪城１−１",
    googleMapsUrl: "https://maps.app.goo.gl/Hv8r9u83XiKRY7pq6",
    latitude: 34.6873,
    longitude: 135.5262,
    notes: "豊臣秀吉が築いた城。天守閣からの眺めが良い。",
    tags: ["城", "歴史", "観光地", "ランドマーク"],
    createdAt: new Date("2024-10-02T10:00:00Z"),
    updatedAt: new Date("2024-10-02T10:00:00Z"),
    visited: false,
    createdBy: mockUsers[3].id,
    rating: 5,
    googlePlaceId: "ChIJoc_c50fnAGAR59GZkQkJVW8",
  },
  {
    id: "osaka-spot-002",
    name: "ユニバーサル・スタジオ・ジャパン",
    address: "大阪府大阪市此花区桜島２丁目１−３３",
    googleMapsUrl: "https://maps.app.goo.gl/iVDFX23Q2J4uhrHb6",
    latitude: 34.6656,
    longitude: 135.4326,
    notes: "ハリウッド映画の世界観を楽しめるテーマパーク。",
    tags: ["テーマパーク", "遊園地", "アトラクション"],
    createdAt: new Date("2024-10-03T09:00:00Z"),
    updatedAt: new Date("2024-10-03T09:00:00Z"),
    visited: false,
    createdBy: mockUsers[4].id,
    rating: 5,
    googlePlaceId: "ChIJoz0xQ9fnAGARvKP3aj4dYqs",
  },
  {
    id: "osaka-spot-003",
    name: "通天閣",
    address: "大阪府大阪市浪速区恵美須東１丁目１８−６",
    googleMapsUrl: "https://maps.app.goo.gl/rmTSoKdyon7q63Mx9",
    latitude: 34.6525,
    longitude: 135.5063,
    notes: "新世界のシンボルタワー。ビリケンさんが有名。",
    tags: ["展望台", "タワー", "観光地", "ランドマーク"],
    createdAt: new Date("2024-10-04T14:00:00Z"),
    updatedAt: new Date("2024-10-04T14:00:00Z"),
    visited: false,
    createdBy: mockUsers[0].id,
    rating: 4,
    googlePlaceId: "ChIJH9R2pkTnAGARU95rU6y9Fzs",
  },
  {
    id: "osaka-spot-004",
    name: "海遊館",
    address: "大阪府大阪市港区海岸通１丁目１−１０",
    googleMapsUrl: "https://maps.app.goo.gl/mXGgSFngqX6M31T68",
    latitude: 34.6549,
    longitude: 135.4289,
    notes: "世界最大級の水族館。ジンベエザメが人気。",
    tags: ["水族館", "動物", "観光地"],
    createdAt: new Date("2024-10-05T11:00:00Z"),
    updatedAt: new Date("2024-10-05T11:00:00Z"),
    visited: false,
    createdBy: mockUsers[1].id,
    rating: 5,
    googlePlaceId: "ChIJq_9K0sPnAGARH9R1o0qH5QY",
  },
  {
    id: "osaka-spot-005",
    name: "黒門市場",
    address: "大阪府大阪市中央区日本橋２丁目４−１",
    googleMapsUrl: "https://maps.app.goo.gl/DkwFgcQdpZ4bhiQj9",
    latitude: 34.6647,
    longitude: 135.506,
    notes: "「大阪の台所」と呼ばれる市場。食べ歩きが楽しい。",
    tags: ["市場", "グルメ", "食べ歩き", "商店街"],
    createdAt: new Date("2024-10-06T12:00:00Z"),
    updatedAt: new Date("2024-10-06T12:00:00Z"),
    visited: false,
    createdBy: mockUsers[2].id,
    rating: 4,
    googlePlaceId: "ChIJ4-Rk_kLnAGAR4pY6q_X8L6o",
  },
  // Tokyo Entertainment Restaurants (Indices 27-32)
  {
    id: "entertainment-restaurant-001",
    name: "鮨さいとう",
    address: "東京都港区六本木1-4-5 アークヒルズサウスタワー1F",
    googleMapsUrl: "https://maps.app.goo.gl/example1", // ダミーURL
    latitude: 35.6668,
    longitude: 139.7418,
    notes: "予約困難なことで有名な最高級寿司店。特別な接待に。",
    tags: ["寿司", "高級", "個室"],
    createdAt: new Date("2024-11-01T19:00:00Z"),
    updatedAt: new Date("2024-11-01T19:00:00Z"),
    visited: false,
    createdBy: mockUsers[3].id,
    rating: 5,
    googlePlaceId: "ChIJEXAMPLE_Saito", // ダミーID
  },
  {
    id: "entertainment-restaurant-002",
    name: "NARISAWA",
    address: "東京都港区南青山2-6-15 南青山ガーデンコート",
    googleMapsUrl: "https://maps.app.goo.gl/HBHw9p2FMPnAa1c47",
    latitude: 35.6705,
    longitude: 139.7191,
    notes: "イノベーティブ里山キュイジーヌ。自然を感じる独創的な料理。",
    tags: ["フレンチ", "イノベーティブ", "個室"],
    createdAt: new Date("2024-11-05T19:30:00Z"),
    updatedAt: new Date("2024-11-05T19:30:00Z"),
    visited: false,
    createdBy: mockUsers[4].id,
    rating: 5,
    googlePlaceId: "ChIJEXAMPLE_Narisawa", // ダミーID
  },
  {
    id: "entertainment-restaurant-003",
    name: "龍吟",
    address: "東京都千代田区有楽町1-1-2 ミッドタウン日比谷 7F",
    googleMapsUrl: "https://maps.app.goo.gl/BcQR2eqSvihPZH587",
    latitude: 35.6749,
    longitude: 139.759,
    notes: "日本の豊かさを表現するモダン懐石。海外からのゲストにも。",
    tags: ["日本料理", "懐石", "モダン", "夜景"],
    createdAt: new Date("2024-11-10T18:30:00Z"),
    updatedAt: new Date("2024-11-10T18:30:00Z"),
    visited: false,
    createdBy: mockUsers[0].id,
    rating: 5,
    googlePlaceId: "ChIJEXAMPLE_Ryugin", // ダミーID
  },
  {
    id: "entertainment-restaurant-004",
    name: "カンテサンス",
    address: "東京都品川区北品川6-7-29 ガーデンシティ品川御殿山 1F",
    googleMapsUrl: "https://maps.app.goo.gl/3YvZghLCHWpAxPLd8",
    latitude: 35.631,
    longitude: 139.7294,
    notes:
      "素材の持ち味を最大限に活かすモダンフレンチ。メニューはおまかせのみ。",
    tags: ["フレンチ", "モダン"],
    createdAt: new Date("2024-11-15T20:00:00Z"),
    updatedAt: new Date("2024-11-15T20:00:00Z"),
    visited: false,
    createdBy: mockUsers[1].id,
    rating: 5,
    googlePlaceId: "ChIJEXAMPLE_Quintessence", // ダミーID
  },
  {
    id: "entertainment-restaurant-005",
    name: "茶禅華",
    address: "東京都港区南麻布4-7-5",
    googleMapsUrl: "https://maps.app.goo.gl/nS1wJSoQsNB7q2d39",
    latitude: 35.6504,
    longitude: 139.7284,
    notes: "和魂漢才をテーマにした中華料理。落ち着いた空間。",
    tags: ["中華", "イノベーティブ", "個室"],
    createdAt: new Date("2024-11-20T19:00:00Z"),
    updatedAt: new Date("2024-11-20T19:00:00Z"),
    visited: false,
    createdBy: mockUsers[2].id,
    rating: 5,
    googlePlaceId: "ChIJEXAMPLE_Sazenka", // ダミーID
  },
  {
    id: "entertainment-restaurant-006",
    name: "うかい亭 表参道",
    address: "東京都渋谷区神宮前5-10-1 表参道 ジャイル 5F",
    googleMapsUrl: "https://maps.app.goo.gl/vAZMjNiujdr2c3Ma6",
    latitude: 35.667,
    longitude: 139.7077,
    notes: "最高級の鉄板焼き。華やかな雰囲気で会話も弾む。",
    tags: ["鉄板焼", "ステーキ", "高級", "夜景"],
    createdAt: new Date("2024-11-25T18:00:00Z"),
    updatedAt: new Date("2024-11-25T18:00:00Z"),
    visited: false,
    createdBy: mockUsers[3].id,
    rating: 5,
    googlePlaceId: "ChIJEXAMPLE_Ukai", // ダミーID
  },
];

// --- Mock Place List Groups ---
// (Define the lists using the places above)
export interface PlaceListGroup {
  id: string;
  name: string;
  description?: string;
  places: Place[];
  sharedUserIds?: string[];
}

// Filter indoor places from mockPlaces
const indoorDatePlaces = mockPlaces.filter((place) =>
  [
    "date-spot-001", // 彫刻の森美術館
    "date-spot-007", // 三鷹の森ジブリ美術館
    "date-spot-009", // サンシャイン水族館
  ].includes(place.id)
);

// Filter sunny day places from mockPlaces
const sunnyDayPlaces = mockPlaces.filter((place) =>
  [
    "date-spot-003", // 江の島
    "date-spot-004", // 国営ひたち海浜公園
    "date-spot-005", // マザー牧場
    "date-spot-006", // 東京ドイツ村
    "date-spot-008", // よみうりランド
  ].includes(place.id)
);

// Filter sunny day places from mockPlaces
const osakaTripPlaces = mockPlaces.filter((place) =>
  [
    "osaka-spot-001", // 大阪城
    "osaka-spot-002", // ユニバーサル・スタジオ・ジャパン
    "osaka-spot-003", // 通天閣
    "osaka-spot-004", // 海遊館
    "osaka-spot-005", // 黒門市場
  ].includes(place.id)
);

// Filter entertainment restaurants from mockPlaces
const entertainmentRestaurants = mockPlaces.filter((place) =>
  [
    "entertainment-restaurant-001",
    "entertainment-restaurant-002",
    "entertainment-restaurant-003",
    "entertainment-restaurant-004",
    "entertainment-restaurant-005",
    "entertainment-restaurant-006",
  ].includes(place.id)
);

export const mockPlaceLists: PlaceListGroup[] = [
  {
    id: "indoor-date",
    name: "デートスポット（雨の日用）",
    description: "雨の日でも楽しめる屋内デートスポット",
    places: indoorDatePlaces,
    sharedUserIds: [mockUsers[0].id, mockUsers[2].id],
  },
  {
    id: "sunny-day",
    name: "デートスポット（晴れた日用）",
    description: "天気の良い日に行きたい屋外デートスポット",
    places: sunnyDayPlaces,
    sharedUserIds: [mockUsers[0].id, mockUsers[2].id],
  },
  {
    id: "osaka-trip",
    name: "大阪旅行",
    description: "大阪満喫プラン",
    places: osakaTripPlaces,
    // Share with all 5 users
    sharedUserIds: [
      mockUsers[0].id,
      mockUsers[1].id,
      mockUsers[2].id,
      mockUsers[3].id,
      mockUsers[4].id,
    ],
  },
  {
    id: "entertainment-restaurants",
    name: "接待リスト",
    description: "大切な接待で使える東京都内の高級レストラン",
    places: entertainmentRestaurants,
    sharedUserIds: [mockUsers[0].id],
  },
];

// --- Helper function to get list details (can be moved to data layer) ---
export async function getPlaceListDetails(
  listId: string // Reverted back to accepting listId string
): Promise<PlaceListGroup | undefined> {
  // const { listId } = params; // Removed this line
  // Simulate fetching data
  await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay
  console.log(`[MockData] Fetching details for listId: ${listId}`);
  const list = mockPlaceLists.find((list) => list.id === listId);
  console.log(`[MockData] Found list: ${list?.name}`);
  return list;
}
