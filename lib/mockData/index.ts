import { Place, User, Group } from "../../types";

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Yuki Tanaka",
    email: "yuki@example.com",
  },
  {
    id: "2",
    name: "Haruka Sato",
    email: "haruka@example.com",
  },
];

export const mockGroups: Group[] = [
  {
    id: "1",
    name: "Weekend Plans",
    members: [mockUsers[0], mockUsers[1]],
    createdBy: "1",
  },
];

export const mockPlaces: Place[] = [
  {
    id: "1",
    name: "Blue Bottle Coffee Shibuya",
    address: "渋谷区神南1-21-15 渋谷モディ 1F",
    googleMapsUrl: "https://maps.google.com/?q=Blue+Bottle+Coffee+Shibuya",
    latitude: 35.66151,
    longitude: 139.70062,
    notes: "新作のコーヒーを試してみたい！",
    tags: ["カフェ", "渋谷", "コーヒー"],
    createdAt: new Date("2023-01-15"),
    visitPlanned: new Date("2023-01-28"),
    visited: false,
    createdBy: "1",
    imageUrl:
      "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  {
    id: "2",
    name: "代官山 蔦屋書店",
    address: "東京都渋谷区猿楽町17-5",
    googleMapsUrl: "https://maps.google.com/?q=Daikanyama+T-SITE",
    latitude: 35.64883,
    longitude: 139.69963,
    notes: "新しい建築の本をチェックしたい",
    tags: ["本屋", "代官山", "建築"],
    createdAt: new Date("2023-01-10"),
    visited: true,
    createdBy: "2",
    imageUrl:
      "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  {
    id: "3",
    name: "東京都現代美術館",
    address: "東京都江東区三好4-1-1",
    googleMapsUrl:
      "https://maps.google.com/?q=Museum+of+Contemporary+Art+Tokyo",
    latitude: 35.68213,
    longitude: 139.81924,
    notes: "来月から始まる企画展が気になる",
    tags: ["美術館", "江東区", "アート"],
    createdAt: new Date("2023-01-05"),
    visitPlanned: new Date("2023-02-15"),
    visited: false,
    createdBy: "1",
    imageUrl:
      "https://images.pexels.com/photos/1674049/pexels-photo-1674049.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  {
    id: "4",
    name: "スタンダードブックストア",
    address: "東京都渋谷区神宮前6-11-1",
    googleMapsUrl: "https://maps.google.com/?q=Standard+Bookstore",
    latitude: 35.66494,
    longitude: 139.70621,
    notes: "友達が勧めていた本を探してみる",
    tags: ["本屋", "渋谷", "表参道"],
    createdAt: new Date("2023-01-18"),
    visited: false,
    createdBy: "2",
    imageUrl:
      "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
];

// Available tags for filtering
export const availableTags = [
  "カフェ",
  "本屋",
  "美術館",
  "レストラン",
  "ショップ",
  "アート",
  "渋谷",
  "新宿",
  "表参道",
  "代官山",
  "江東区",
  "コーヒー",
  "建築",
  "写真",
];
