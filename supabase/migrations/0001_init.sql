-- ============================================================
-- SAUNA DAY MVP — 初期スキーマ
-- Phase 2: design.md §2.3 に準拠
-- ============================================================

-- ============ Enum ============

create type proximity_kind as enum ('on_site', 'nearby', 'view_only');
create type ref_kind       as enum ('sauna', 'restaurant', 'spot', 'hotel');
create type spot_category  as enum ('sightseeing', 'activity', 'onsen');

-- ============ マスタ ============

-- 全タグ語彙の単一定義
create table taxonomy_terms (
  category    text not null,
  key         text not null,
  label_ja    text not null,
  icon        text not null,
  sort_order  integer not null default 0,
  is_advanced boolean not null default false,
  primary key (category, key)
);

-- スコア重み（ハードコード禁止）
create table search_weights (
  key        text primary key,
  weight     numeric(4,3) not null check (weight >= 0 and weight <= 1),
  updated_at timestamptz not null default now()
);

-- 出発地マスタ
create table origins (
  key      text primary key,
  label_ja text not null,
  lat      numeric(9,6) not null,
  lng      numeric(9,6) not null
);

-- ============ サウナ ============

create table saunas (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  description       text,
  prefecture        text not null,
  area              text,
  address           text,
  lat               numeric(9,6),
  lng               numeric(9,6),
  price_min         integer,
  price_max         integer,
  price_note        text,
  capacity_min      integer,
  capacity_max      integer,
  temp_min          integer,
  temp_max          integer,
  business_hours    jsonb,
  closed_note       text,
  supports_day_trip boolean not null default true,
  supports_lodging  boolean not null default false,
  parking_note      text,
  reservation_url   text,
  official_url      text,
  phone             text,
  popularity_score  numeric(4,3) not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (price_max is null or price_min is null or price_max >= price_min),
  check (capacity_max is null or capacity_min is null or capacity_max >= capacity_min)
);

create index idx_saunas_prefecture on saunas (prefecture);
create index idx_saunas_price_min on saunas (price_min);

create table sauna_images (
  id         uuid primary key default gen_random_uuid(),
  sauna_id   uuid not null references saunas(id) on delete cascade,
  url        text not null,
  alt        text not null check (alt <> ''),
  sort_order integer not null default 0,
  is_hero    boolean not null default false
);

create index idx_sauna_images_sauna on sauna_images (sauna_id, sort_order);

-- タイプ / 熱源 / 設備 / 外気浴 / 貸切 / 利用条件 / アクセス
create table sauna_features (
  id       uuid primary key default gen_random_uuid(),
  sauna_id uuid not null references saunas(id) on delete cascade,
  category text not null,
  key      text not null,
  note     text,
  foreign key (category, key) references taxonomy_terms(category, key),
  unique (sauna_id, category, key)
);

create index idx_sauna_features_sauna on sauna_features (sauna_id);
create index idx_sauna_features_tag on sauna_features (category, key);

-- 「近くにある / 見える」
create table sauna_environments (
  id        uuid primary key default gen_random_uuid(),
  sauna_id  uuid not null references saunas(id) on delete cascade,
  category  text not null default 'environment' check (category = 'environment'),
  key       text not null,
  proximity proximity_kind not null,
  foreign key (category, key) references taxonomy_terms(category, key),
  unique (sauna_id, key)
);

create index idx_sauna_environments_sauna on sauna_environments (sauna_id);

-- クールダウン体験（「入れる」）
create table sauna_cooldowns (
  id             uuid primary key default gen_random_uuid(),
  sauna_id       uuid not null references saunas(id) on delete cascade,
  category       text not null default 'cooldown' check (category = 'cooldown'),
  key            text not null,
  water_temp_min integer,
  water_temp_max integer,
  depth_cm       integer,
  can_dive       boolean,
  is_natural     boolean,
  has_flow       boolean,
  note           text,
  foreign key (category, key) references taxonomy_terms(category, key),
  unique (sauna_id, key)
);

create index idx_sauna_cooldowns_sauna on sauna_cooldowns (sauna_id);

create table sauna_experiences (
  id       uuid primary key default gen_random_uuid(),
  sauna_id uuid not null references saunas(id) on delete cascade,
  category text not null default 'experience' check (category = 'experience'),
  key      text not null,
  note     text,
  foreign key (category, key) references taxonomy_terms(category, key),
  unique (sauna_id, key)
);

create index idx_sauna_experiences_sauna on sauna_experiences (sauna_id);

-- ============ 周辺施設 ============

create table restaurants (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  genre          text not null,
  price_min      integer,
  price_max      integer,
  business_hours jsonb,
  address        text,
  lat            numeric(9,6),
  lng            numeric(9,6),
  official_url   text
);

create table sauna_restaurants (
  sauna_id            uuid not null references saunas(id) on delete cascade,
  restaurant_id       uuid not null references restaurants(id) on delete cascade,
  distance_km         numeric(5,1),
  travel_minutes      integer,
  recommended_timing  text,
  recommend_reason    text,
  recommend_score     numeric(3,2) not null default 0.5,
  primary key (sauna_id, restaurant_id)
);

create table spots (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       spot_category not null,
  description    text,
  price_min      integer,
  business_hours jsonb,
  address        text,
  lat            numeric(9,6),
  lng            numeric(9,6),
  official_url   text
);

create table sauna_spots (
  sauna_id         uuid not null references saunas(id) on delete cascade,
  spot_id          uuid not null references spots(id) on delete cascade,
  distance_km      numeric(5,1),
  travel_minutes   integer,
  duration_minutes integer,
  recommend_score  numeric(3,2) not null default 0.5,
  primary key (sauna_id, spot_id)
);

create table hotels (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  lodging_type    text not null,
  price_min       integer,
  price_max       integer,
  address         text,
  lat             numeric(9,6),
  lng             numeric(9,6),
  official_url    text,
  reservation_url text
);

create table sauna_hotels (
  sauna_id        uuid not null references saunas(id) on delete cascade,
  hotel_id        uuid not null references hotels(id) on delete cascade,
  distance_km     numeric(5,1),
  travel_minutes  integer,
  recommend_score numeric(3,2) not null default 0.5,
  primary key (sauna_id, hotel_id)
);

-- ============ ユーザー ============

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  home_origin  text references origins(key),
  created_at   timestamptz not null default now()
);

create table favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  sauna_id   uuid not null references saunas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, sauna_id)
);

create index idx_favorites_user on favorites (user_id, created_at desc);

create table saved_plans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  title          text not null,
  plan_date      date,
  sauna_id       uuid not null references saunas(id),
  origin_key     text references origins(key),
  departure_time time,
  is_lodging     boolean not null default false,
  created_at     timestamptz not null default now()
);

create index idx_saved_plans_user on saved_plans (user_id, created_at desc);

create table plan_items (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references saved_plans(id) on delete cascade,
  sort_order integer not null,
  start_time time,
  ref_type   ref_kind not null,
  ref_id     uuid not null,
  note       text,
  unique (plan_id, sort_order)
);
