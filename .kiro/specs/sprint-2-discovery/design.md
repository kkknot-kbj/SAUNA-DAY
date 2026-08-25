# Sprint 2 — 設計

対応する要件定義: `requirements.md`

---

## 1. データモデル変更

### 1.1 `saunas` テーブルへのカラム追加

```sql
alter table saunas
  add column featured_until date,
  add column featured_copy  text;
```

- `featured_until`: この日付まで「今月のおすすめ」に表示する。null = 非掲載
- `featured_copy`: おすすめカード内のキャッチコピー。null ならエリア名を表示

### 1.2 `saved_plans` テーブルへのカラム追加

```sql
alter table saved_plans
  add column is_public boolean not null default false;
```

- 共有URLを発行するときに true に設定する
- RLS: `is_public = true` のプランは匿名ユーザーでも select 可能にする

### 1.3 新テーブル `saved_conditions`

```sql
create table saved_conditions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  label            text not null,
  conditions_json  jsonb not null,
  created_at       timestamptz not null default now()
);

create index idx_saved_conditions_user on saved_conditions (user_id, created_at desc);

alter table saved_conditions enable row level security;
create policy "本人のみ読み取り" on saved_conditions for select using (auth.uid() = user_id);
create policy "本人のみ挿入" on saved_conditions for insert with check (auth.uid() = user_id);
create policy "本人のみ削除" on saved_conditions for delete using (auth.uid() = user_id);
```

### 1.4 エリアマスタ

エリアはテーブルではなく `src/lib/taxonomy/areas.ts` に定数として管理する。
理由: エリアの追加/変更は開発者がコードベースで行う。DBに持たせるとUIと定義が乖離しやすい。

```ts
export type AreaDef = {
  key: string;        // 'okutama', 'hakone' 等
  label: string;      // '奥多摩・檜原'
  /** saunas.area に入る値のリスト。1エリアに複数のarea値を紐付ける */
  areaValues: string[];
};
```

---

## 2. 検索条件の拡張

### 2.1 `SearchConditions` への追加フィールド

```ts
// 既存の SearchConditions.required に追加
areaKeys: string[];       // 要件18: エリアフィルタ
excludeVisited: boolean;  // 要件23: 既訪問除外
```

### 2.2 フィルタロジック（`src/lib/search/filter.ts`）

エリアフィルタ:
- `areaKeys` が空でなければ、サウナの `area` が該当エリアの `areaValues` のいずれかに含まれることを要求する
- `area` が null のサウナはエリアフィルタに合致しない（除外される）

既訪問除外:
- `excludeVisited = true` かつ認証済みの場合、お気に入り済みの `saunaId` リストを取得し、それに含まれるサウナを除外する

---

## 3. プラン生成の営業時間チェック

### 3.1 候補フィルタの追加（`src/lib/plan/candidates.ts`）

```ts
export function collectCandidates(
  sauna: SaunaDetail,
  places: LinkedPlaces,
  isLodging: boolean,
  dayOfWeek?: DayOfWeek | null,  // 新パラメータ
): PlanCandidates
```

- `dayOfWeek` が指定されている場合:
  - `restaurants`: その曜日の `businessHours[dayOfWeek]` が null のものを除外
  - `spots`: 同上
  - `hotels`: 同上
- フィルタ後の候補が0件（全カテゴリ合計で）になった場合、フィルタを無効化して全候補を使う

### 3.2 曜日の決定

- `PlanUserContext.date` が ISO 日付文字列なら、そこから曜日を導出する
- `date` が null なら曜日フィルタを適用しない

---

## 4. プラン共有

### 4.1 ルーティング

```
/plans/share/[id]/page.tsx   — 公開閲覧ページ（Server Component）
```

### 4.2 データ取得

- `saved_plans` を `id` で取得（RLSは `is_public = true` で匿名アクセスを許可するポリシーを追加）
- `plan_items` を取得し、`resolvePlanItems` で施設情報を DB から解決する

### 4.3 共有ボタン

- `/plans/[id]/page.tsx` に `ShareButton` Client Component を追加
- 初回タップ時に Server Action で `is_public = true` に更新
- Web Share API 対応: `navigator.share({ title, url })` を呼ぶ
- 非対応: `navigator.clipboard.writeText(url)` + 「コピーしました」トースト

### 4.4 OGP

`/plans/share/[id]/page.tsx` で `generateMetadata` を使い、title/description を動的に設定する。

---

## 5. ホーム画面の構成変更

### 5.1 現在の構成

```
メインコピー
StartFlow
RecentlyViewed
```

### 5.2 新しい構成

```
メインコピー
エリアから探す（横スクロールチップ）
今月のおすすめ（最大3件のカード）
StartFlow（条件を決めて探す）
保存した条件（認証済み + 1件以上）
最近見たサウナ
```

- 「エリアから探す」「今月のおすすめ」はライトユーザーの入り口
- 「StartFlow」は具体的に条件を絞りたい人向け
- 「保存した条件」はリピーター向け

---

## 6. ファイル構成（新規追加分）

```
src/
  lib/
    taxonomy/
      areas.ts                    # エリア定義
  components/
    home/
      AreaChips.tsx              # エリア横スクロール
      FeaturedSection.tsx        # 今月のおすすめ
      SavedConditionsList.tsx    # 保存した条件一覧
  app/
    plans/
      share/[id]/
        page.tsx                 # 公開閲覧ページ
      [id]/
        ShareButton.tsx          # 共有ボタン

supabase/
  migrations/
    0004_sprint2.sql             # featured_until, is_public, saved_conditions
```

---

## 7. Repository interface 追加

```ts
// 既存 Repository に追加
listFeaturedSaunas(): Promise<SaunaSummary[]>;
getPublicPlan(id: string): Promise<HolidayPlan | null>;
listSavedConditions(): Promise<SavedCondition[]>;
saveCondition(label: string, conditions: SearchConditions): Promise<string>;
deleteCondition(id: string): Promise<void>;
setPublicPlan(id: string, isPublic: boolean): Promise<void>;
```
