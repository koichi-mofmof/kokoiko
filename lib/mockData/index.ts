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
    user_comment: "自然の中でアートを楽しめる。ピカソ館も必見。",
    tags: [
      { id: "美術館", name: "美術館" },
      { id: "アート", name: "アート" },
      { id: "自然", name: "自然" },
    ],
    createdAt: new Date("2024-04-01T10:00:00Z"),
    updatedAt: new Date("2024-04-01T10:00:00Z"),
    visited: "not_visited",
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
    user_comment: "食べ歩きや中華料理が楽しい。異国情緒あふれる街並み。",
    tags: [
      { id: "中華街", name: "中華街" },
      { id: "グルメ", name: "グルメ" },
      { id: "食べ歩き", name: "食べ歩き" },
    ],
    createdAt: new Date("2024-05-10T12:00:00Z"),
    updatedAt: new Date("2024-05-10T12:00:00Z"),
    visited: "visited",
    createdBy: mockUsers[1].id,
    rating: 4,
    googlePlaceId: "ChIJN8zS-kGWGGARn5lIbmoV80Q",
    imageUrl:
      "https://images.pexels.com/photos/30968027/pexels-photo-30968027.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  // Additional Date Spots (Indices 12-19)
  {
    id: "date-spot-003",
    name: "江の島",
    address: "神奈川県藤沢市江の島",
    googleMapsUrl: "https://maps.app.goo.gl/m1BRs44mGpAMWAEK8",
    latitude: 35.3014,
    longitude: 139.4817,
    user_comment: "シーキャンドルからの眺めが最高。水族館や岩屋も楽しめる。",
    tags: [
      { id: "海", name: "海" },
      { id: "展望台", name: "展望台" },
      { id: "水族館", name: "水族館" },
    ],
    createdAt: new Date("2024-06-01T11:00:00Z"),
    updatedAt: new Date("2024-06-01T11:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[0].id,
    rating: 4,
    googlePlaceId: "ChIJcQfQ3kKFGGAREk8y3mI-B9k",
    imageUrl:
      "https://images.pexels.com/photos/29112375/pexels-photo-29112375.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  {
    id: "date-spot-004",
    name: "国営ひたち海浜公園",
    address: "茨城県ひたちなか市馬渡字大沼605-4",
    googleMapsUrl: "https://maps.app.goo.gl/BvWFUBZZq93C614FA",
    latitude: 36.4047,
    longitude: 140.5916,
    user_comment: "ネモフィラやコキアの絶景が有名。季節の花々が楽しめる。",
    tags: [
      { id: "公園", name: "公園" },
      { id: "花畑", name: "花畑" },
      { id: "絶景", name: "絶景" },
    ],
    createdAt: new Date("2024-06-10T10:30:00Z"),
    updatedAt: new Date("2024-06-10T10:30:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[1].id,
    rating: 5,
    googlePlaceId: "ChIJgUBK7_K9ImARt7rM2G37L9o",
    imageUrl:
      "https://images.pexels.com/photos/14159605/pexels-photo-14159605.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  {
    id: "date-spot-005",
    name: "マザー牧場",
    address: "千葉県富津市田倉940-3",
    googleMapsUrl: "https://maps.app.goo.gl/ZZ7q7tCBS6cFeodu6",
    latitude: 35.1895,
    longitude: 139.9487,
    user_comment: "動物とのふれあいや味覚狩り、花畑など一日中楽しめる。",
    tags: [
      { id: "牧場", name: "牧場" },
      { id: "動物", name: "動物" },
      { id: "味覚狩り", name: "味覚狩り" },
    ],
    createdAt: new Date("2024-07-01T09:00:00Z"),
    updatedAt: new Date("2024-07-01T09:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[0].id,
    rating: 4,
    googlePlaceId: "ChIJm5_zL0iAImARJ4i_9Z1C0kU",
    imageUrl:
      "https://images.pexels.com/photos/31968757/pexels-photo-31968757.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  {
    id: "date-spot-006",
    name: "東京ドイツ村",
    address: "千葉県袖ケ浦市永吉419",
    googleMapsUrl: "https://maps.app.goo.gl/1SRfJKJFciafECBE7",
    latitude: 35.4483,
    longitude: 139.9952,
    user_comment: "広大な敷地で遊べる。冬のイルミネーションが特に有名。",
    tags: [
      { id: "テーマパーク", name: "テーマパーク" },
      { id: "イルミネーション", name: "イルミネーション" },
    ],
    createdAt: new Date("2024-07-15T15:00:00Z"),
    updatedAt: new Date("2024-07-15T15:00:00Z"),
    visited: "not_visited",
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
    user_comment: "ジブリの世界観に浸れる。完全予約制なので注意。",
    tags: [
      { id: "美術館", name: "美術館" },
      { id: "ジブリ", name: "ジブリ" },
      { id: "アニメ", name: "アニメ" },
    ],
    createdAt: new Date("2024-08-01T14:00:00Z"),
    updatedAt: new Date("2024-08-01T14:00:00Z"),
    visited: "visited",
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
    user_comment:
      "アトラクションやプール、冬はジュエルミネーションが楽しめる。",
    tags: [
      { id: "遊園地", name: "遊園地" },
      { id: "イルミネーション", name: "イルミネーション" },
      { id: "プール", name: "プール" },
    ],
    createdAt: new Date("2024-08-15T10:00:00Z"),
    updatedAt: new Date("2024-08-15T10:00:00Z"),
    visited: "visited",
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
    user_comment: "天空のペンギンが人気。都会のオアシス。",
    tags: [
      { id: "水族館", name: "水族館" },
      { id: "動物", name: "動物" },
    ],
    createdAt: new Date("2024-09-01T13:00:00Z"),
    updatedAt: new Date("2024-09-01T13:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[0].id,
    rating: 4,
    googlePlaceId: "ChIJ4fyhqtuMGGARr36dO0Y6kL8",
    imageUrl:
      "https://images.pexels.com/photos/3699434/pexels-photo-3699434.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  {
    id: "date-spot-010",
    name: "川越氷川神社",
    address: "埼玉県川越市宮下町2-11-3",
    googleMapsUrl: "https://maps.app.goo.gl/fVW2RN3NzXCGP3QY6",
    latitude: 35.9242,
    longitude: 139.4868,
    user_comment: "縁結びのパワースポットとして有名。風鈴祭りも人気。",
    tags: [
      { id: "神社", name: "神社" },
      { id: "縁結び", name: "縁結び" },
      { id: "パワースポット", name: "パワースポット" },
    ],
    createdAt: new Date("2024-09-15T11:00:00Z"),
    updatedAt: new Date("2024-09-15T11:00:00Z"),
    visited: "not_visited",
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
    user_comment: "豊臣秀吉が築いた城。天守閣からの眺めが良い。",
    tags: [
      { id: "城", name: "城" },
      { id: "歴史", name: "歴史" },
      { id: "ランドマーク", name: "ランドマーク" },
    ],
    createdAt: new Date("2024-10-02T10:00:00Z"),
    updatedAt: new Date("2024-10-02T10:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[3].id,
    rating: 5,
    googlePlaceId: "ChIJoc_c50fnAGAR59GZkQkJVW8",
    imageUrl:
      "https://images.pexels.com/photos/4058530/pexels-photo-4058530.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  {
    id: "osaka-spot-002",
    name: "ユニバーサル・スタジオ・ジャパン",
    address: "大阪府大阪市此花区桜島２丁目１−３３",
    googleMapsUrl: "https://maps.app.goo.gl/iVDFX23Q2J4uhrHb6",
    latitude: 34.6656,
    longitude: 135.4326,
    user_comment: "ハリウッド映画の世界観を楽しめるテーマパーク。",
    tags: [
      { id: "テーマパーク", name: "テーマパーク" },
      { id: "遊園地", name: "遊園地" },
      { id: "アトラクション", name: "アトラクション" },
    ],
    createdAt: new Date("2024-10-03T09:00:00Z"),
    updatedAt: new Date("2024-10-03T09:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[4].id,
    rating: 5,
    googlePlaceId: "ChIJoz0xQ9fnAGARvKP3aj4dYqs",
    imageUrl:
      "https://images.pexels.com/photos/5432843/pexels-photo-5432843.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  {
    id: "osaka-spot-003",
    name: "通天閣",
    address: "大阪府大阪市浪速区恵美須東１丁目１８−６",
    googleMapsUrl: "https://maps.app.goo.gl/rmTSoKdyon7q63Mx9",
    latitude: 34.6525,
    longitude: 135.5063,
    user_comment: "新世界のシンボルタワー。ビリケンさんが有名。",
    tags: [
      { id: "展望台", name: "展望台" },
      { id: "タワー", name: "タワー" },
      { id: "ランドマーク", name: "ランドマーク" },
    ],
    createdAt: new Date("2024-10-04T14:00:00Z"),
    updatedAt: new Date("2024-10-04T14:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[0].id,
    rating: 4,
    googlePlaceId: "ChIJH9R2pkTnAGARU95rU6y9Fzs",
    imageUrl:
      "https://images.pexels.com/photos/7729468/pexels-photo-7729468.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  {
    id: "osaka-spot-004",
    name: "海遊館",
    address: "大阪府大阪市港区海岸通１丁目１−１０",
    googleMapsUrl: "https://maps.app.goo.gl/mXGgSFngqX6M31T68",
    latitude: 34.6549,
    longitude: 135.4289,
    user_comment: "世界最大級の水族館。ジンベエザメが人気。",
    tags: [
      { id: "水族館", name: "水族館" },
      { id: "動物", name: "動物" },
    ],
    createdAt: new Date("2024-10-05T11:00:00Z"),
    updatedAt: new Date("2024-10-05T11:00:00Z"),
    visited: "not_visited",
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
    user_comment: "「大阪の台所」と呼ばれる市場。食べ歩きが楽しい。",
    tags: [
      { id: "市場", name: "市場" },
      { id: "グルメ", name: "グルメ" },
      { id: "食べ歩き", name: "食べ歩き" },
      { id: "商店街", name: "商店街" },
    ],
    createdAt: new Date("2024-10-06T12:00:00Z"),
    updatedAt: new Date("2024-10-06T12:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[2].id,
    rating: 4,
    googlePlaceId: "ChIJ4-Rk_kLnAGAR4pY6q_X8L6o",
    imageUrl:
      "https://images.pexels.com/photos/31196085/pexels-photo-31196085.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  // New Sauna Spots
  {
    id: "sauna-001",
    name: "サウナしきじ",
    address: "静岡県静岡市駿河区敷地２丁目２５−１",
    googleMapsUrl: "https://maps.app.goo.gl/kxeFaq4sXN2vWnjHA",
    latitude: 34.9507331,
    longitude: 138.4140179,
    user_comment: "サウナの聖地。天然水かけ流しの水風呂が最高。",
    tags: [
      { id: "聖地", name: "聖地" },
      { id: "天然水", name: "天然水" },
      { id: "水風呂", name: "水風呂" },
    ],
    createdAt: new Date("2024-12-01T10:00:00Z"),
    updatedAt: new Date("2024-12-01T10:00:00Z"),
    visited: "visited",
    createdBy: mockUsers[0].id,
    rating: 5,
    googlePlaceId: "ChIJSAUNA_Shikiji", // Dummy ID
  },
  {
    id: "sauna-002",
    name: "草加健康センター",
    address: "埼玉県草加市北谷２丁目２３−２３",
    googleMapsUrl: "https://maps.app.goo.gl/JquHDPAZEfSdg2Lb8",
    latitude: 35.8410448,
    longitude: 139.7809065,
    user_comment: "爆風ロウリュと薬湯が名物。食事も美味しい。",
    tags: [
      { id: "健康センター", name: "健康センター" },
      { id: "ロウリュ", name: "ロウリュ" },
      { id: "薬湯", name: "薬湯" },
    ],
    createdAt: new Date("2024-12-05T11:00:00Z"),
    updatedAt: new Date("2024-12-05T11:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[1].id,
    rating: 5,
    googlePlaceId: "ChIJSAUNA_Soka", // Dummy ID
  },
  {
    id: "sauna-003",
    name: "サウナと天然温泉 湯らっくす",
    address: "熊本県熊本市中央区本荘町７２２",
    googleMapsUrl: "https://maps.app.goo.gl/njC21W3W74pf2f9D7",
    latitude: 32.785262,
    longitude: 130.702207,
    user_comment: "MADMAXボタンと深水風呂が有名。アウフグースも人気。",
    tags: [
      { id: "温泉", name: "温泉" },
      { id: "MADMAX", name: "MADMAX" },
      { id: "アウフグース", name: "アウフグース" },
    ],
    createdAt: new Date("2024-12-10T12:00:00Z"),
    updatedAt: new Date("2024-12-10T12:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[2].id,
    rating: 5,
    googlePlaceId: "ChIJSAUNA_Yulax", // Dummy ID
  },
  {
    id: "sauna-004",
    name: "御船山楽園ホテル らかんの湯",
    address: "佐賀県武雄市武雄町 武雄 ４１００",
    googleMapsUrl: "https://maps.app.goo.gl/YLH9u5i9qR3f1q4NA",
    latitude: 33.182544,
    longitude: 130.016065,
    user_comment: "チームラボとのコラボが美しい。自然と一体になれるサウナ。",
    tags: [
      { id: "ホテル", name: "ホテル" },
      { id: "アート", name: "アート" },
      { id: "自然", name: "自然" },
    ],
    createdAt: new Date("2024-12-15T13:00:00Z"),
    updatedAt: new Date("2024-12-15T13:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[3].id,
    rating: 5,
    googlePlaceId: "ChIJSAUNA_Rakan", // Dummy ID
    imageUrl:
      "https://images.pexels.com/photos/5582214/pexels-photo-5582214.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
  },
  {
    id: "sauna-005",
    name: "スパメッツァ おおたか 竜泉寺の湯",
    address: "千葉県流山市おおたかの森西1丁目15番1",
    googleMapsUrl: "https://maps.app.goo.gl/czioFJk2AmY7WiWc8",
    latitude: 35.873133,
    longitude: 139.922832,
    user_comment: "ドラゴンロウリュが人気。多種多様なお風呂とサウナ。",
    tags: [
      { id: "スーパー銭湯", name: "スーパー銭湯" },
      { id: "ドラゴンロウリュ", name: "ドラゴンロウリュ" },
    ],
    createdAt: new Date("2024-12-20T14:00:00Z"),
    updatedAt: new Date("2024-12-20T14:00:00Z"),
    visited: "not_visited",
    createdBy: mockUsers[4].id,
    rating: 5,
    googlePlaceId: "ChIJSAUNA_SpaMetsä", // Dummy ID
  },
];

// --- Mock Place List Groups ---
// (Define the lists using the places above)
export interface PlaceListGroup {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  places: Place[];
  sharedUserIds?: string[];
  ranking?: RankedPlace[]; // ランキング情報 (オプショナル)
  rankingTitle?: string; // ランキングのタイトル
  rankingDescription?: string; // ランキングの説明 (オプショナル)
}

// Define RankedPlace interface
export interface RankedPlace {
  placeId: string; // mockPlaces の id
  rank: number;
  comment?: string; // ユーザーが追加できる短いコメント
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
    "date-spot-002", // 横浜中華街
    "date-spot-003", // 江の島
    "date-spot-004", // 国営ひたち海浜公園
    "date-spot-005", // マザー牧場
    "date-spot-006", // 東京ドイツ村
    "date-spot-008", // よみうりランド
  ].includes(place.id)
);

// Filter Osaka trip places from mockPlaces
const osakaTripPlaces = mockPlaces.filter((place) =>
  [
    "osaka-spot-001", // 大阪城
    "osaka-spot-002", // ユニバーサル・スタジオ・ジャパン
    "osaka-spot-003", // 通天閣
    "osaka-spot-004", // 海遊館
    "osaka-spot-005", // 黒門市場
  ].includes(place.id)
);

// Filter Favorite Sauna places from mockPlaces
const favoriteSaunaPlaces = mockPlaces.filter((place) =>
  ["sauna-001", "sauna-002", "sauna-003", "sauna-004", "sauna-005"].includes(
    place.id
  )
);

export const mockPlaceLists: PlaceListGroup[] = [
  {
    id: "indoor-date",
    name: "デートスポット（雨の日用）",
    description: "雨の日でも楽しめる屋内デートスポット",
    ownerId: mockUsers[0].id,
    places: indoorDatePlaces,
    sharedUserIds: [mockUsers[0].id, mockUsers[2].id],
    rankingTitle: "雨の日でも安心！まったりデートランキング",
    rankingDescription:
      "急な雨でも大丈夫！インドアで楽しめる、二人のおすすめスポットを集めました。",
    ranking: [
      {
        placeId: "date-spot-001",
        rank: 1,
        comment: "アートに触れる静かな時間。ピカソ作品は必見！",
      },
      {
        placeId: "date-spot-009",
        rank: 2,
        comment: "天空のペンギンに癒される。意外と広い！",
      },
      {
        placeId: "date-spot-007",
        rank: 3,
        comment: "ジブリの世界にどっぷり浸れる。予約頑張った甲斐あり！",
      },
    ],
  },
  {
    id: "sunny-day",
    name: "デートスポット（晴れた日用）",
    description: "天気の良い日に行きたい屋外デートスポット",
    ownerId: mockUsers[0].id,
    places: sunnyDayPlaces,
    sharedUserIds: [mockUsers[0].id, mockUsers[2].id],
    rankingTitle: "青空と楽しむ！アクティブデートランキング",
    rankingDescription: "太陽の下で思いっきり遊べる、おすすめデートスポット！",
    ranking: [
      {
        placeId: "date-spot-004",
        rank: 1,
        comment: "ネモフィラ畑は圧巻！春は絶対行くべき。",
      },
      {
        placeId: "date-spot-003",
        rank: 2,
        comment: "シーキャンドルからの眺めが最高！食べ歩きも楽しい。",
      },
      {
        placeId: "date-spot-005",
        rank: 3,
        comment:
          "動物と触れ合えて子供も大人も楽しめる！ソフトクリームが美味しい。",
      },
      {
        placeId: "date-spot-008",
        rank: 4,
        comment: "イルミネーションの時期は特にロマンチック。",
      },
      {
        placeId: "date-spot-002",
        rank: 5,
        comment: "",
      },
      {
        placeId: "date-spot-006",
        rank: 6,
        comment: "",
      },
    ],
  },
  {
    id: "osaka-trip",
    name: "大阪旅行",
    description: "大阪満喫プラン",
    ownerId: mockUsers[0].id,
    places: osakaTripPlaces,
    sharedUserIds: [
      mockUsers[0].id,
      mockUsers[1].id,
      mockUsers[2].id,
      mockUsers[3].id,
      mockUsers[4].id,
    ],
    rankingTitle: "食い倒れ＆観光！大阪満喫ランキング TOP5",
    rankingDescription:
      "大阪の魅力をギュッと凝縮！絶対外せないスポットはここ！",
    ranking: [
      {
        placeId: "osaka-spot-002",
        rank: 1,
        comment: "一日中遊べる！アトラクションもショーも最高！",
      },
      {
        placeId: "osaka-spot-001",
        rank: 2,
        comment: "大阪城はやっぱり迫力満点。歴史を感じる。",
      },
      {
        placeId: "osaka-spot-004",
        rank: 3,
        comment: "ジンベイザメに感動！展示も見応えあり。",
      },
      {
        placeId: "osaka-spot-005",
        rank: 4,
        comment: "食べ歩き天国！新鮮な魚介類が安くて美味しい。",
      },
      {
        placeId: "osaka-spot-003",
        rank: 5,
        comment: "ザ・大阪な雰囲気が面白い。ビリケンさんの足の裏も触った！",
      },
    ],
  },
  {
    id: "favorite-saunas",
    name: "お気に入りサウナ",
    description: "至福のととのいを提供する厳選サウナリスト",
    ownerId: mockUsers[0].id,
    places: favoriteSaunaPlaces,
    sharedUserIds: [mockUsers[0].id],
    rankingTitle: "ととのいの聖地巡礼！至高のサウナランキング",
    rankingDescription:
      "サウナーなら一度は行きたい、究極のリラックス体験ができる名店たち。",
    ranking: [
      {
        placeId: "sauna-001",
        rank: 1,
        comment: "水風呂が神。間違いなく日本一のサウナの一つ。",
      },
      {
        placeId: "sauna-003",
        rank: 2,
        comment: "MADMAXボタンは必須！アウフグースも最高。",
      },
      {
        placeId: "sauna-002",
        rank: 3,
        comment: "爆風ロウリュと薬湯のコンボがたまらない。ご飯も美味しい。",
      },
      {
        placeId: "sauna-005",
        rank: 4,
        comment: "ドラゴンロウリュは圧巻。お風呂の種類も豊富。",
      },
      {
        placeId: "sauna-004",
        rank: 5,
        comment: "アートと自然に囲まれてととのう贅沢体験。",
      },
    ],
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
