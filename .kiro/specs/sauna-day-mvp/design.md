# SAUNA DAY MVP — 設計

対応する要件定義: `requirements.md`
横断ルール: `.kiro/steering/`（product / design-principles / data-integrity / tech / structure）

---

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────┐
│ app/  画面（Server Component 既定）           │
│   探す / 条件設定 / 検索結果 / 詳細           │
│   プラン / 行きたい / 保存プラン / 認証        │
└───────────────┬─────────────────────────────┘
                │ 表示用の型のみ
┌───────────────▼─────────────────────────────┐
│ components/  ui（ドメイン非依存） +           │
│              search / sauna / plan            │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│ lib/                                          │
│  search/  filter → score → rank → relax      │
│           （純関数・テスト対象）               │
│  plan/    candidates → prompt → validate     │
│  data/    Repository interface                │
│  taxonomy/ 語彙の単一定義                     │
└───────────────┬─────────────────────────────┘
                │
        ┌───────┴────────┐
   mock-repository   supabase-repository
     (Phase 1)          (Phase 2+)
```

**設計の核**は3点。

1. **検索は決定的**。AIを通さない。純関数なのでテストで守れる
2. **AIは参照IDしか返せない**。事実情報の捏造が構造的に起きない
3. **語彙は1箇所**。9カテゴリのタグを `taxonomy/terms.ts` に集約し、条件UIをデータ駆動で生成する

---

## 2. データモデル

### 2.1 全体像

```
taxonomy_terms  ─── (category, key) を各タグテーブルが参照
search_weights  ─── スコア重み（デプロイなしで変更可）
origins         ─── 出発地マスタ

saunas ──┬── sauna_images
         ├── sauna_features       (category, key)  タイプ/熱源/設備/外気浴/貸切/利用条件/アクセス
         ├── sauna_environments   (key, proximity) 「近くにある・見える」
         ├── sauna_cooldowns      (key, 水温/水深/飛び込み/天然/流れ) 「入れる」
         ├── sauna_experiences    (key)
         ├── sauna_restaurants ── restaurants
         ├── sauna_spots ──────── spots   (観光 / アクティビティ / 温泉)
         └── sauna_hotels ─────── hotels

auth.users ── profiles ──┬── favorites ─── saunas
                         └── saved_plans ── plan_items (ref_type, ref_id)
```

### 2.2 設計判断

**環境とクールダウンを分ける**（要件4）
`sauna_environments` は「川が近い / 海が見える」、`sauna_cooldowns` は「川に入れる」。
`proximity` に `on_site` / `nearby` / `view_only` を持たせ、近接の度合いまで表現する。
この2テーブルを1つのbooleanに潰すことは禁止。

**温泉とアクティビティは `spots` に統合**
`spots.category` に `sightseeing` / `activity` / `onsen` を持たせる。
テーブルを増やさず、プラン生成時は category で絞る。将来 onsen 固有の属性が増えたら分離する。

**タグは `taxonomy_terms` への外部キー**
`sauna_features.category + key` が `taxonomy_terms` を参照する複合FK。
存在しないタグを登録できないので、データ品質が構造的に守られる。

**所要時間は「事実」ではなく「導出値」**
施設の営業時間や料金と違い、出発地からの所要時間は計算による**目安**。
DBに固定値として持たず、`origins` の座標と `saunas` の座標から算出する。
UIでは「目安」であることが分かる表記にする（`data-integrity.md` の推測禁止は施設の事実情報に対する規定であり、明示された導出値はこれに当たらない）。
算出できない場合は「不明」。

**`business_hours` は jsonb**
曜日ごと・季節ごとの変動が施設によって大きく、正規化すると扱いにくい。
形式は下記に固定し、不明な曜日は**キーを持たせない**（`null` を明示的に入れてもよいが、空文字は禁止）。

```json
{
  "mon": { "open": "10:00", "close": "22:00" },
  "tue": null,
  "note": "冬季は要問合せ"
}
```

### 2.3 スキーマ定義（`supabase/migrations/0001_init.sql` の内容）

```sql
-- ============ マスタ ============

create type proximity_kind as enum ('on_site', 'nearby', 'view_only');
create type ref_kind       as enum ('sauna', 'restaurant', 'spot', 'hotel');
create type spot_category  as enum ('sightseeing', 'activity', 'onsen');

-- 全タグ語彙の単一定義
create table taxonomy_terms (
  category    text not null,   -- sauna_type / heat_source / equipment / environment /
                               -- outdoor_bath / experience / privacy / usage / access / cooldown
  key         text not null,   -- snake_case 英語
  label_ja    text not null,
  icon        text not null,   -- lucide アイコン名
  sort_order  integer not null default 0,
  is_advanced boolean not null default false,  -- true = 「条件を追加」で表示
  primary key (category, key)
);

-- スコア重み（ハードコード禁止・要件6）
create table search_weights (
  key        text primary key,  -- condition_match / distance / price / popularity / preference
  weight     numeric(4,3) not null check (weight >= 0 and weight <= 1),
  updated_at timestamptz not null default now()
);

-- 出発地マスタ
create table origins (
  key      text primary key,   -- tokyo / osaka / nagoya ...
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
  price_min         integer,          -- null = 不明
  price_max         integer,
  price_note        text,
  capacity_min      integer,
  capacity_max      integer,
  temp_min          integer,          -- サウナ室温度
  temp_max          integer,
  business_hours    jsonb,            -- null = 不明
  closed_note       text,
  supports_day_trip boolean not null default true,
  supports_lodging  boolean not null default false,
  parking_note      text,             -- null = 不明
  reservation_url   text,             -- null = 予約導線を出さない（要件17-4）
  official_url      text,
  phone             text,
  popularity_score  numeric(4,3) not null default 0,  -- 0..1 に正規化済み
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (price_max is null or price_min is null or price_max >= price_min),
  check (capacity_max is null or capacity_min is null or capacity_max >= capacity_min)
);

create index on saunas (prefecture);
create index on saunas (price_min);

create table sauna_images (
  id         uuid primary key default gen_random_uuid(),
  sauna_id   uuid not null references saunas(id) on delete cascade,
  url        text not null,
  alt        text not null,           -- 空文字禁止（a11y）
  sort_order integer not null default 0,
  is_hero    boolean not null default false
);
create index on sauna_images (sauna_id, sort_order);

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
create index on sauna_features (sauna_id);
create index on sauna_features (category, key);

-- 「近くにある / 見える」（入れるかどうかは cooldowns 側・要件4）
create table sauna_environments (
  id        uuid primary key default gen_random_uuid(),
  sauna_id  uuid not null references saunas(id) on delete cascade,
  -- 複合FKにリテラルは使えないため、定数カラムを置いて taxonomy_terms を参照する
  category  text not null default 'environment' check (category = 'environment'),
  key       text not null,
  proximity proximity_kind not null,
  foreign key (category, key) references taxonomy_terms(category, key),
  unique (sauna_id, key)
);
create index on sauna_environments (sauna_id);

-- 「入れる」クールダウン体験（要件4）
create table sauna_cooldowns (
  id             uuid primary key default gen_random_uuid(),
  sauna_id       uuid not null references saunas(id) on delete cascade,
  category       text not null default 'cooldown' check (category = 'cooldown'),
  key            text not null,     -- river / lake / sea / snow / spring_water /
                                    -- ground_water / barrel / pool / cold_bath / shower / none
  water_temp_min integer,           -- null = 不明
  water_temp_max integer,
  depth_cm       integer,
  can_dive       boolean,           -- null = 不明（false と区別する）
  is_natural     boolean,
  has_flow       boolean,
  note           text,
  foreign key (category, key) references taxonomy_terms(category, key),
  unique (sauna_id, key)
);
create index on sauna_cooldowns (sauna_id);

create table sauna_experiences (
  id       uuid primary key default gen_random_uuid(),
  sauna_id uuid not null references saunas(id) on delete cascade,
  category text not null default 'experience' check (category = 'experience'),
  key      text not null,
  note     text,
  foreign key (category, key) references taxonomy_terms(category, key),
  unique (sauna_id, key)
);
create index on sauna_experiences (sauna_id);

-- ============ 周辺施設（要件11） ============

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
  recommended_timing  text,          -- 'after_sauna' / 'before_sauna' / 'lunch' / 'dinner'
  recommend_reason    text,
  recommend_score     numeric(3,2) not null default 0.5,
  primary key (sauna_id, restaurant_id)
);

create table spots (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  category                 spot_category not null,   -- 観光 / アクティビティ / 温泉
  description              text,
  price_min                integer,
  business_hours           jsonb,
  address                  text,
  lat                      numeric(9,6),
  lng                      numeric(9,6),
  official_url             text
);

create table sauna_spots (
  sauna_id         uuid not null references saunas(id) on delete cascade,
  spot_id          uuid not null references spots(id) on delete cascade,
  distance_km      numeric(5,1),
  travel_minutes   integer,
  duration_minutes integer,          -- 所要時間
  recommend_score  numeric(3,2) not null default 0.5,
  primary key (sauna_id, spot_id)
);

create table hotels (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  lodging_type    text not null,     -- hotel / ryokan / guesthouse / glamping / campsite
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
create index on favorites (user_id, created_at desc);

create table saved_plans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  title          text not null,
  plan_date      date,
  sauna_id       uuid not null references saunas(id),   -- プランの中心
  -- 出発（「10:00 東京出発」）は施設ではないので plan_items にせず、
  -- プランのメタ情報として持つ。ref_kind を施設だけに保てる
  origin_key     text references origins(key),
  departure_time time,
  is_lodging     boolean not null default false,
  created_at     timestamptz not null default now()
);
create index on saved_plans (user_id, created_at desc);

-- 自由テキストで施設情報を持たない（要件12-5 / data-integrity）
create table plan_items (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references saved_plans(id) on delete cascade,
  sort_order integer not null,
  start_time time,
  ref_type   ref_kind not null,
  ref_id     uuid not null,
  note       text,              -- AI が書いてよい一言のみ
  unique (plan_id, sort_order)
);
```

`ref_id` はポリモーフィック参照のためFK制約を張れない。**アプリ層で必ず検証する**（§5.3）。

### 2.4 RLS 方針（Phase 4）

| テーブル | anon | 認証ユーザー |
|---|---|---|
| `saunas` および関連タグ・画像・周辺施設・マスタ | select | select |
| `profiles` | – | 本人のみ select/update |
| `favorites` | – | 本人のみ全操作 |
| `saved_plans` / `plan_items` | – | 本人のみ全操作（`plan_items` は親プランの所有者で判定） |

未登録での検索が要件（15-7）なので、施設系は anon に読み取りを開放する。

---

## 3. 型定義（`src/lib/types/`）

```ts
// conditions.ts ── 検索条件
export type StayType = 'day_trip' | 'lodging';

export type RequiredConditions = {
  date: string | null;              // ISO date
  partySize: number | null;
  originKey: string | null;
  maxTravelMinutes: number | null;
  stayType: StayType | null;
  budgetMax: number | null;
  absoluteTags: TagRef[];           // 貸切等（満たさなければ除外）
};

export type WishConditions = {
  tags: TagRef[];                   // 環境 / タイプ / クールダウン / 外気浴 / 体験
};

export type TagRef = { category: TaxonomyCategory; key: string };

export type SearchConditions = {
  required: RequiredConditions;
  wish: WishConditions;
};
```

```ts
// sauna.ts ── 施設
export type SaunaSummary = {
  id: string;
  slug: string;
  name: string;
  prefecture: string;
  heroImage: { url: string; alt: string } | null;
  primaryTags: TagRef[];            // 表示は3〜4件に絞る（要件7-7）
  priceMin: number | null;          // null → 「不明」
  travelMinutes: number | null;     // 導出値。null → 「不明」
};

export type SaunaDetail = SaunaSummary & {
  description: string | null;
  priceMax: number | null;
  priceNote: string | null;
  capacityMin: number | null;
  capacityMax: number | null;
  tempMin: number | null;
  tempMax: number | null;
  businessHours: BusinessHours | null;
  closedNote: string | null;
  parkingNote: string | null;
  reservationUrl: string | null;
  officialUrl: string | null;
  supportsDayTrip: boolean;
  supportsLodging: boolean;
  images: { url: string; alt: string }[];
  features: TagRef[];
  environments: { key: string; proximity: 'on_site' | 'nearby' | 'view_only' }[];
  cooldowns: Cooldown[];
  experiences: TagRef[];
};

export type Cooldown = {
  key: string;
  waterTempMin: number | null;
  waterTempMax: number | null;
  depthCm: number | null;
  canDive: boolean | null;          // null と false を区別する
  isNatural: boolean | null;
  hasFlow: boolean | null;
  note: string | null;
};
```

```ts
// search.ts ── 検索結果
export type ScoreBreakdown = {
  conditionMatch: { matched: TagRef[]; unmatched: TagRef[]; ratio: number };
  distance:   { travelMinutes: number | null; normalized: number };
  price:      { priceMin: number | null; normalized: number };
  popularity: { raw: number; normalized: number };
  preference: { matchedTags: TagRef[]; normalized: number };
  total: number;
};

export type SearchResultItem = {
  sauna: SaunaSummary;
  score: ScoreBreakdown;            // 「なぜこの順番？」の表示元（要件8）
};

export type RelaxSuggestion = {
  kind: 'travel_time' | 'budget' | 'drop_wish_tag';
  label: string;                    // 「あと30分移動できれば」
  delta: number | null;
  droppedTag: TagRef | null;
  additionalCount: number;          // 増える件数
  bestMatchRatio: string;           // 「10/10」
};
```

```ts
// plan.ts ── 休日プラン
export type PlanItem = {
  startTime: string | null;         // AI が決めてよい
  refType: 'sauna' | 'restaurant' | 'spot' | 'hotel';
  refId: string;                    // 候補リスト内のIDのみ許可
  note: string | null;              // AI が書いてよい短文
};

export type HolidayPlan = {
  saunaId: string;                  // プランの中心
  title: string;
  date: string | null;
  isLodging: boolean;
  items: PlanItem[];
};
```

**`PlanItem` に施設名・料金・営業時間のフィールドを持たせない。** 表示時にDBから引く。

---

## 4. 検索の設計（要件5・6・8・9）

### 4.1 パイプライン

```
SearchConditions
   │
   ├─ filter.ts   applyRequiredConditions(saunas, required) → Sauna[]
   │                必須条件を満たさないものを除外
   ├─ score.ts    calculateScore(sauna, conditions, weights, preference) → ScoreBreakdown
   │                各要素を 0..1 に正規化し、重み付き和を取る
   ├─ rank        total 降順 → 同値は slug 昇順（決定的・要件6-5）
   └─ relax.ts    suggestRelaxations(allSaunas, conditions) → RelaxSuggestion[]
```

すべて**副作用のない純関数**。Repository から受け取った配列を入力とする。
Phase 2 で必須条件の絞り込みをSQL側に移すが、`score.ts` のシグネチャは変えない。

### 4.2 除外ロジック（filter.ts）

| 条件 | 除外の判定 |
|---|---|
| 移動時間 | 導出した `travelMinutes > maxTravelMinutes` |
| 予算 | `priceMin > budgetMax` |
| 人数 | `partySize < capacityMin` または `partySize > capacityMax` |
| 日帰り/宿泊 | `stayType='lodging'` かつ `supportsLodging=false` 等 |
| 絶対条件 | `absoluteTags` のいずれかを施設が持たない |

**IMPORTANT: 値が `null`（不明）の項目では除外判定を行わない**（要件5-9）。
不明を理由に落とすと、情報が揃っていない良い施設が消える。一致にも数えない。

### 4.3 スコア計算（score.ts）

各要素を 0..1 に正規化してから重み付き和を取る。

| 要素 | 正規化 |
|---|---|
| `conditionMatch` | 一致した希望条件数 ÷ 指定された希望条件数（指定0件なら 1.0） |
| `distance` | `1 - travelMinutes / maxTravelMinutes`（上限なしなら 240分を基準）。`null` は 0.5 |
| `price` | 結果集合内の最小〜最大で min-max 正規化し反転（安いほど高得点）。`null` は 0.5 |
| `popularity` | `saunas.popularity_score`（投入時点で 0..1） |
| `preference` | ユーザーの `favorites` から集計したタグ分布との一致度。ゲストは後述 |

不明値に 0 ではなく **0.5（中立）** を与えるのは、情報欠損を減点として扱わないため。

### 4.4 重みの外部化（weights.ts・要件6-3）

```ts
export const DEFAULT_WEIGHTS: Weights = {
  condition_match: 0.55,
  distance:        0.20,
  price:           0.10,
  popularity:      0.10,
  preference:      0.05,
};

/** Phase 1 は定数、Phase 2 以降は search_weights テーブルから取得する */
export async function getWeights(): Promise<Weights>;

/** ゲスト時は preference の重みを他要素へ比例配分する（要件6-6） */
export function redistributeForGuest(w: Weights): Weights;
```

合計が 1.0 になることを実行時に検証し、ずれていれば正規化する。

### 4.5 条件緩和（relax.ts・要件9）

除外前の全件に対し、緩和案ごとに件数を数える。

1. 移動時間 `+30` / `+60` 分
2. 予算 `+1,000` / `+3,000` 円
3. 一致しなかった希望条件を1件ずつ外す

`additionalCount` の降順で並べ、上位1〜2件のみ提示する（画面を説明で埋めないため）。
**結果が0件のときは必ず表示する**（要件9-5）。

### 4.6 所要時間の導出（utils/distance.ts）

`origins` と `saunas` の座標から Haversine で直線距離を出し、係数を掛けて分に換算する。

```
travelMinutes = round(haversineKm × ROAD_FACTOR / AVG_SPEED_KMH × 60)
ROAD_FACTOR = 1.3      // 直線距離 → 実走行距離の補正
AVG_SPEED_KMH = 55
```

座標または出発地が不明なら `null`（→「不明」）。
**UIでは「目安」と明示する。** 精度が要る段階でルーティングAPIに差し替える（この関数の内部のみ変更で済む）。

---

## 5. 休日プランの設計（要件12）

### 5.1 フロー

```
「このサウナで休日を作る」
   │
   ├─ candidates.ts  gatherCandidates(saunaId, conditions)
   │     DBから紐付く restaurants / spots(sightseeing|activity|onsen) / hotels を取得
   │     日帰り指定なら hotels を含めない（要件12-7）
   │
   ├─ prompt.ts      buildPlanInput(sauna, candidates, conditions)  ← Phase 7
   │     渡すのはDBの正確な値のみ。IDを必ず添える
   │
   ├─ LLM            候補の中から選び、順序と時刻とnoteを返す
   │
   ├─ validate.ts    validatePlan(aiOutput, candidates)
   │     候補外の refId を含む項目を破棄（要件12-6）
   │
   └─ 表示           refId から施設情報をDBで解決してレンダリング
```

### 5.2 AI の入出力契約

**入力**（DB由来のみ）

```ts
type PlanInput = {
  sauna:      { id: string; name: string; businessHours: BusinessHours | null; ... };
  restaurants: { id: string; name: string; genre: string; travelMinutes: number | null; ... }[];
  spots:       { id: string; name: string; category: SpotCategory; durationMinutes: number | null; ... }[];
  hotels:      { id: string; name: string; lodgingType: string; priceMin: number | null; ... }[];
  conditions:  { date: string | null; partySize: number | null; originLabel: string | null;
                 maxTravelMinutes: number | null; stayType: StayType | null };
};
```

**出力**（これ以外のフィールドは受け付けない）

```ts
type PlanOutput = { items: PlanItem[] };   // startTime / refType / refId / note のみ
```

施設名・料金・営業時間を返すフィールドが**そもそも存在しない**ので、捏造が構造的に起きない。

### 5.3 検証（validate.ts）

1. `refId` が該当 `refType` の候補リストに含まれるか → 含まれなければ項目を破棄
2. サウナ本体が items に1件だけ含まれるか → なければ先頭に挿入
3. 日帰り指定で `refType='hotel'` が含まれていたら破棄
4. `startTime` が `HH:mm` 形式か → 不正なら `null`
5. `note` の文字数上限（60文字）を超えたら切り捨て

`ref_id` にFK制約が張れない代わりに、この関数を**保存前の唯一の関門**とする。

### 5.4 Phase 6 の扱い

Phase 6（プラン生成）では**AIを使わず決定的なルールで組む**（営業時間と移動時間から順序を決める）。
Phase 7 でその出力をLLMに置き換える。`validate.ts` は両方で共通に通す。
これにより、AI統合前にプラン画面を完成させられる。

---

## 6. 語彙の設計（`lib/taxonomy/terms.ts`・要件3）

```ts
export type TaxonomyCategory =
  | 'sauna_type' | 'heat_source' | 'equipment' | 'environment'
  | 'outdoor_bath' | 'experience' | 'privacy' | 'usage' | 'access' | 'cooldown';

export type TaxonomyTerm = {
  category: TaxonomyCategory;
  key: string;          // snake_case 英語
  labelJa: string;      // 日本語表示名（ここだけが持つ）
  icon: LucideIconName; // 線画アイコン
  sortOrder: number;
  isAdvanced: boolean;  // true → 「条件を追加」で表示（要件2-3）
};

export const TAXONOMY: readonly TaxonomyTerm[];
export function termsOf(category: TaxonomyCategory): TaxonomyTerm[];
export function labelOf(ref: TagRef): string;
export function iconOf(ref: TagRef): LucideIconName;
```

条件設定UIはこの配列から生成する。選択肢の追加はここ1箇所とマイグレーションのseedのみで完結する。

**階層の割り当て**

| 階層 | カテゴリ |
|---|---|
| 必須条件 | 日付・人数・出発地・移動時間・日帰り/宿泊・予算 + `privacy`（絶対条件として指定した場合） |
| 希望条件 | `environment` / `sauna_type` / `cooldown` / `outdoor_bath` / `experience` |
| 詳細条件 | `heat_source` / `equipment` / `usage` / `access` + 各カテゴリの `isAdvanced=true` の項目 |

---

## 7. コンポーネント構成

### 7.1 プリミティブ（`components/ui/`・ドメイン非依存）

| コンポーネント | 役割 |
|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'quiet'`。角丸4px |
| `Chip` | 条件の選択肢。選択状態を罫線+チェックでも表す（要件2-7） |
| `Tag` | 表示専用のタグ（アイコン+ラベル） |
| `Sheet` | 下から出るシート。条件の詳細入力に使う |
| `Disclosure` | 「条件を追加」「詳細を見る」の開閉 |
| `Field` | ラベル + 入力のレイアウト |
| `Stepper` | 人数の増減 |
| `Stat` | ラベル + 値。値が `null` なら「不明」を表示する責務を持つ |
| `EmptyState` | 空状態。次の行動を1つだけ受け取る |

**`Stat` に「不明」表示を集約する**のが要点。各画面で `?? '不明'` を書かせない。

### 7.2 ドメインコンポーネント

| ディレクトリ | コンポーネント |
|---|---|
| `layout/` | `PageShell`, `AppHeader`, `BottomNav`（探す/行きたい/プランの3項目） |
| `search/` | `ConditionGroup`, `ChipGroup`, `OriginPicker`, `TravelTimePicker`, `BudgetPicker`, `ResultCount`, `RelaxSuggestionBar`, `WhyRankedSheet` |
| `sauna/` | `SaunaCard`, `SaunaHero`, `SpecTable`, `CooldownList`, `MatchScore`, `LinkedPlaceList`, `FavoriteButton` |
| `plan/` | `Timeline`, `TimelineItem`, `PlanHeader`, `PlanSaveBar` |

### 7.3 Client / Server の境界

| 画面 | 方針 |
|---|---|
| ホーム | Server。5問の入力部のみ Client |
| 条件設定 | 条件選択が中核なので Client。ただし語彙は Server から props で渡す |
| 検索結果 | Server で検索実行。`WhyRankedSheet` と `RelaxSuggestionBar` のみ Client |
| サウナ詳細 | Server。`FavoriteButton` と画像ギャラリーのみ Client |
| プラン | Server で候補取得・生成。保存操作は Server Action |
| 行きたい / 保存プラン | Server。削除操作は Server Action |
| 認証 | Client（OAuth リダイレクト） |

---

## 8. 状態管理

### 8.1 検索条件（`state/conditions-context.tsx`）

React Context + `useReducer`。ホーム → 条件設定 → 検索結果 で引き継ぐ。
URL のクエリパラメータにも反映し、リロード・共有で失われないようにする（要件2-9）。

### 8.2 ゲスト保存（`state/guest-storage.ts`）

`localStorage` に以下を保持する。

```ts
type GuestState = {
  conditions: SearchConditions | null;
  recentlyViewed: string[];        // slug、最大10件
  pendingFavorite: string | null;  // 認証後に完了させる保存対象（要件13-3）
};
```

認証成功後、`pendingFavorite` を `favorites` へ、`conditions` を `profiles` へ移行し、`localStorage` を破棄する（要件15-5）。

### 8.3 preference の算出

ユーザーの `favorites` に含まれるサウナのタグを集計し、出現頻度を 0..1 に正規化してタグごとの重みとする。
候補サウナのタグとの内積を `preference.normalized` とする。
`favorites` が0件のユーザーとゲストは `redistributeForGuest` で preference の重みを他へ回す。

---

## 9. デザイントークンの実装

`src/app/globals.css` に Tailwind v4 の `@theme` で定義する。値は `design-principles.md` を正とする。

```css
@import "tailwindcss";

@theme {
  --color-ink: #16181A;
  --color-ink-muted: #5C6166;
  --color-ink-faint: #9AA0A6;
  --color-line: #E3E1DD;
  --color-surface: #F7F6F3;
  --color-base: #FFFFFF;
  --color-accent: #3A4A3F;
  --color-accent-hover: #2C3931;
  --color-accent-weak: #EDF0EC;
  --color-danger: #8C3A2E;

  --radius-sm: 2px;
  --radius-md: 4px;

  --font-serif: var(--font-noto-serif-jp);
  --font-sans: var(--font-noto-sans-jp);
}
```

フォントは `next/font/google` で `Noto_Serif_JP` / `Noto_Sans_JP` を読み込み、CSS変数として `layout.tsx` で適用する。

---

## 10. テスト方針

`lib/search/` と `lib/plan/validate.ts` を Vitest で固める。ここが壊れると価値が消える。

| 対象 | 検証内容 |
|---|---|
| `filter.ts` | 各必須条件で除外される / `null` では除外されない（要件5-9） |
| `score.ts` | 内訳の合計が total と一致 / 不明値が 0.5 になる / 一致率の計算 |
| `weights.ts` | 合計1.0への正規化 / ゲスト時の再配分 |
| `rank` | 同スコアで順序が安定する（要件6-5） |
| `relax.ts` | 0件時に必ず提案が返る / 件数が正しい |
| `validate.ts` | 候補外 refId の破棄 / 日帰りで hotel 破棄 / サウナ本体の補完 |

UIの網羅的テストはMVPでは行わない。

---

## 11. 未決定事項

実装を進める中で判断が必要になる点。現時点では以下の暫定方針で進める。

| 項目 | 暫定方針 |
|---|---|
| 施設写真の入手 | Phase 1 は単色プレースホルダ + `alt` テキスト。実写真は後で差し替え |
| 対象エリア | **MVPは関東（1都6県）限定。** 全国展開は `saunas.prefecture` の値が増えるだけで、スキーマ変更は不要 |
| 出発地の粒度 | Phase 1 は関東の主要駅マスタ（`origins`）のみ。住所入力・現在地は後 |
| 所要時間の精度 | Haversine + 係数。ルーティングAPIは精度が問題になってから |
| LLM プロバイダ | Phase 7 で決定。`prompt.ts` と `validate.ts` の境界を保てば差し替え可能 |
| 人気スコアの算出 | Phase 1 は手動設定値。実運用では閲覧数・保存数から算出 |
