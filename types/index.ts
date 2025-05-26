export interface Place {
  id: string;
  name: string;
  address: string;
  googleMapsUrl: string;
  latitude: number;
  longitude: number;
  tags: { id: string; name: string }[];
  createdAt: Date;
  updatedAt?: Date;
  visited: "visited" | "not_visited";
  createdBy: string;
  imageUrl?: string;
  rating?: number;
  googlePlaceId?: string;
  listPlaceId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isOwner?: boolean;
}

export interface Group {
  id: string;
  name: string;
  members: User[];
  createdBy: string;
}

export interface FilterOptions {
  tags: string[];
  visited: "visited" | "not_visited" | null;
  groupId: string | null;
  prefecture: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
}

export type ViewMode = "map" | "list" | "ranking";

/**
 * プレイスリストの型定義
 * データベース定義のplace_listsテーブルに対応
 */
export interface PlaceList {
  id: string;
  name: string;
  description?: string | null;
  is_public?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by: string;
  places?: Place[];
  place_count?: number;
  sharedUserIds?: string[];
  collaborators?: User[];
  permission?: string;
  ranking?: RankedPlace[];
  rankingTitle?: string;
  rankingDescription?: string;
}

/**
 * ランキングに表示する場所情報
 */
export interface RankedPlace {
  placeId: string;
  rank: number;
  comment?: string;
}

// list_place_commntsテーブル用の型
export interface ListPlaceComment {
  id: string;
  list_place_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}
