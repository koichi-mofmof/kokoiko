export interface Place {
  id: string;
  name: string;
  address: string;
  googleMapsUrl: string;
  latitude: number;
  longitude: number;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
  visitPlanned?: Date;
  visited: boolean;
  createdBy: string;
  imageUrl?: string;
  rating?: number;
  googlePlaceId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  members: User[];
  createdBy: string;
}

export interface FilterOptions {
  tags: string[];
  visited: boolean | null;
  groupId: string | null;
  prefecture: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
}

export type ViewMode = "map" | "list" | "ranking";
