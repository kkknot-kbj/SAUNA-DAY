/**
 * Supabase Database 型定義。
 *
 * 本来は `supabase gen types typescript` で自動生成する。
 * Phase 2 では手動で定義し、スキーマ変更時に更新する。
 *
 * Relationships は join クエリの型推論に使われる。
 * Phase 2 で join が必要な箇所は getLinkedPlaces のみ。
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<R, I = R, U = Partial<R>> = {
  Row: R;
  Insert: I;
  Update: U;
  Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }[];
};

// ──────────────── Row 型 ────────────────

type TaxonomyTermsRow = {
  category: string;
  key: string;
  label_ja: string;
  icon: string;
  sort_order: number;
  is_advanced: boolean;
};

type SearchWeightsRow = {
  key: string;
  weight: number;
  updated_at: string;
};

type OriginsRow = {
  key: string;
  label_ja: string;
  lat: number;
  lng: number;
};

type SaunasRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  prefecture: string;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_min: number | null;
  price_max: number | null;
  price_note: string | null;
  capacity_min: number | null;
  capacity_max: number | null;
  temp_min: number | null;
  temp_max: number | null;
  business_hours: Json | null;
  closed_note: string | null;
  supports_day_trip: boolean;
  supports_lodging: boolean;
  parking_note: string | null;
  reservation_url: string | null;
  official_url: string | null;
  phone: string | null;
  popularity_score: number;
  created_at: string;
  updated_at: string;
};

type SaunaImagesRow = {
  id: string;
  sauna_id: string;
  url: string;
  alt: string;
  sort_order: number;
  is_hero: boolean;
};

type SaunaFeaturesRow = {
  id: string;
  sauna_id: string;
  category: string;
  key: string;
  note: string | null;
};

type SaunaEnvironmentsRow = {
  id: string;
  sauna_id: string;
  category: string;
  key: string;
  proximity: 'on_site' | 'nearby' | 'view_only';
};

type SaunaCooldownsRow = {
  id: string;
  sauna_id: string;
  category: string;
  key: string;
  water_temp_min: number | null;
  water_temp_max: number | null;
  depth_cm: number | null;
  can_dive: boolean | null;
  is_natural: boolean | null;
  has_flow: boolean | null;
  note: string | null;
};

type SaunaExperiencesRow = {
  id: string;
  sauna_id: string;
  category: string;
  key: string;
  note: string | null;
};

type RestaurantsRow = {
  id: string;
  name: string;
  genre: string;
  price_min: number | null;
  price_max: number | null;
  business_hours: Json | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  official_url: string | null;
};

type SaunaRestaurantsRow = {
  sauna_id: string;
  restaurant_id: string;
  distance_km: number | null;
  travel_minutes: number | null;
  recommended_timing: string | null;
  recommend_reason: string | null;
  recommend_score: number;
};

type SpotsRow = {
  id: string;
  name: string;
  category: 'sightseeing' | 'activity' | 'onsen';
  description: string | null;
  price_min: number | null;
  business_hours: Json | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  official_url: string | null;
};

type SaunaSpotsRow = {
  sauna_id: string;
  spot_id: string;
  distance_km: number | null;
  travel_minutes: number | null;
  duration_minutes: number | null;
  recommend_score: number;
};

type HotelsRow = {
  id: string;
  name: string;
  lodging_type: string;
  price_min: number | null;
  price_max: number | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  official_url: string | null;
  reservation_url: string | null;
};

type SaunaHotelsRow = {
  sauna_id: string;
  hotel_id: string;
  distance_km: number | null;
  travel_minutes: number | null;
  recommend_score: number;
};

type ProfilesRow = {
  id: string;
  display_name: string | null;
  home_origin: string | null;
  created_at: string;
};

type FavoritesRow = {
  id: string;
  user_id: string;
  sauna_id: string;
  created_at: string;
};

type FavoritesInsert = {
  id?: string;
  user_id: string;
  sauna_id: string;
  created_at?: string;
};

type SavedPlansRow = {
  id: string;
  user_id: string;
  title: string;
  plan_date: string | null;
  sauna_id: string;
  origin_key: string | null;
  departure_time: string | null;
  is_lodging: boolean;
  created_at: string;
};

type SavedPlansInsert = {
  id?: string;
  user_id: string;
  title: string;
  plan_date?: string | null;
  sauna_id: string;
  origin_key?: string | null;
  departure_time?: string | null;
  is_lodging?: boolean;
  created_at?: string;
};

type PlanItemsRow = {
  id: string;
  plan_id: string;
  sort_order: number;
  start_time: string | null;
  ref_type: 'sauna' | 'restaurant' | 'spot' | 'hotel';
  ref_id: string;
  note: string | null;
};

type PlanItemsInsert = {
  id?: string;
  plan_id: string;
  sort_order: number;
  start_time?: string | null;
  ref_type: 'sauna' | 'restaurant' | 'spot' | 'hotel';
  ref_id: string;
  note?: string | null;
};

// ──────────────── Database 型 ────────────────

export type Database = {
  public: {
    Tables: {
      taxonomy_terms: Table<TaxonomyTermsRow>;
      search_weights: Table<SearchWeightsRow>;
      origins: Table<OriginsRow>;
      saunas: Table<SaunasRow>;
      sauna_images: Table<SaunaImagesRow>;
      sauna_features: Table<SaunaFeaturesRow>;
      sauna_environments: Table<SaunaEnvironmentsRow>;
      sauna_cooldowns: Table<SaunaCooldownsRow>;
      sauna_experiences: Table<SaunaExperiencesRow>;
      restaurants: Table<RestaurantsRow>;
      sauna_restaurants: Table<SaunaRestaurantsRow>;
      spots: Table<SpotsRow>;
      sauna_spots: Table<SaunaSpotsRow>;
      hotels: Table<HotelsRow>;
      sauna_hotels: Table<SaunaHotelsRow>;
      profiles: Table<ProfilesRow>;
      favorites: Table<FavoritesRow, FavoritesInsert>;
      saved_plans: Table<SavedPlansRow, SavedPlansInsert>;
      plan_items: Table<PlanItemsRow, PlanItemsInsert>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      proximity_kind: 'on_site' | 'nearby' | 'view_only';
      ref_kind: 'sauna' | 'restaurant' | 'spot' | 'hotel';
      spot_category: 'sightseeing' | 'activity' | 'onsen';
    };
    CompositeTypes: Record<string, never>;
  };
};
