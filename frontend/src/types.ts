export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar: string | null;
  avatar_url?: string;
  avatar_image?: string | null;
}

export type Role = "owner" | "editor" | "viewer";

export interface MapBoard {
  id: number;
  name: string;
  description: string;
  emoji: string;
  is_public: boolean;
  categories_count: number;
  places_count: number;
  collaborators_count: number;
  my_role: Role | null;
  owner: number;
  owner_name: string;
  is_shared: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

/** 推薦端點回傳的精簡地點（省略 want_reason/experience_note 等個人欄位） */
export interface RecommendationPlace {
  id: number;
  category: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  map: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string;
  status: string;
  rating: number | null;
  tags: string[];
  created_by_name: string | null;
  distance_km: number | null;
}

export interface Recommendations {
  high_rated: RecommendationPlace[];
  nearby: RecommendationPlace[];
  wishlist: RecommendationPlace[];
  friends: RecommendationPlace[];
}

export interface PublicPlace {
  id: number;
  category: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string;
  status: string;
  rating: number | null;
  tags: string[];
  note: string;
}

export interface PublicMapData {
  map: {
    id: number;
    name: string;
    emoji: string;
    description: string;
    owner_name: string;
    categories_count: number;
    places_count: number;
  };
  categories: Category[];
  places: PublicPlace[];
}

export interface Collaborator {
  id: number;
  user_id: number;
  email: string;
  display_name: string;
  avatar: string | null;
  role: Exclude<Role, "owner">;
  invited_by_name: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  map: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  is_public: boolean;
  is_collaborative: boolean;
  sort_order: number;
  places_count: number;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: number;
  category: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  map: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string;
  google_place_id: string;
  status: string;
  rating: number | null;
  recommend_level: number | null;
  tags: string[];
  note: string;
  want_reason: string;
  experience_note: string;
  cover_photo: string | null;
  created_by: number | null;
  created_by_name: string | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  distance_km: number | null;
}

export interface Presets {
  statuses: string[];
  colors: string[];
  tags: string[];
  icons: string[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ViewMode = "split" | "map" | "list";
