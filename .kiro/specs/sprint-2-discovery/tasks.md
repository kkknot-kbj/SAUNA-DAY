# Sprint 2 — タスク一覧

対応する要件: `requirements.md`
対応する設計: `design.md`

---

## Phase A: データ基盤（P0 の前提）

- [ ] A-1. `src/lib/taxonomy/areas.ts` を作成。エリア定義（key, label, areaValues）を追加する
- [ ] A-2. `supabase/migrations/0004_sprint2.sql` を作成。saunas に featured_until / featured_copy、saved_plans に is_public、saved_conditions テーブルを追加する
- [ ] A-3. `SearchConditions` 型に `areaKeys: string[]` と `excludeVisited: boolean` を追加する
- [ ] A-4. Repository interface に `listFeaturedSaunas`, `getPublicPlan`, `listSavedConditions`, `saveCondition`, `deleteCondition`, `setPublicPlan` を追加する
- [ ] A-5. モックデータの saunas に `featured_until` / `featured_copy` を数件設定する

## Phase B: エリアから探す（要件18）

- [ ] B-1. `src/lib/search/filter.ts` にエリアフィルタを追加する。`areaKeys` が空でなければ area の一致を要求する
- [ ] B-2. `src/components/home/AreaChips.tsx` を作成する。横スクロールのエリアチップ一覧
- [ ] B-3. ホーム画面（`src/app/page.tsx`）に AreaChips セクションを追加する
- [ ] B-4. エリアチップのタップで `/search/results?area=<key>` に遷移するようにする
- [ ] B-5. 検索結果ページで `area` パラメータを `SearchConditions.areaKeys` にマッピングする
- [ ] B-6. 条件設定画面にもエリア選択UIを追加する（チップグループ）

## Phase C: 今月のおすすめ（要件19）

- [ ] C-1. Repository に `listFeaturedSaunas()` を実装する（mock + supabase）
- [ ] C-2. `src/components/home/FeaturedSection.tsx` を作成する。写真付きカード最大3件
- [ ] C-3. ホーム画面に FeaturedSection を追加する（エリアの下、StartFlow の上）
- [ ] C-4. おすすめカードをタップでサウナ詳細へ遷移。`?from=/` パラメータを付ける

## Phase D: 営業時間チェック（要件20）

- [ ] D-1. `collectCandidates` に `dayOfWeek` パラメータを追加し、定休日の施設を除外するロジックを実装する
- [ ] D-2. `/plans/new/result/page.tsx` で `date` から曜日を導出し、`collectCandidates` に渡す
- [ ] D-3. プロンプトに曜日情報を追加し、営業時間を考慮した時刻配分を指示する
- [ ] D-4. 除外後に候補0件になった場合のフォールバック（除外無効化）を実装する

## Phase E: プラン共有（要件21）

- [ ] E-1. `/plans/share/[id]/page.tsx` を作成する。認証不要の公開閲覧ページ
- [ ] E-2. Repository に `getPublicPlan(id)` を実装する（is_public = true のみ取得可能）
- [ ] E-3. RLS に is_public = true で匿名 select を許可するポリシーを追加する
- [ ] E-4. `/plans/[id]/ShareButton.tsx` を作成する。Web Share API + クリップボードフォールバック
- [ ] E-5. Server Action `sharePlan(id)` を作成する。`is_public = true` に更新する
- [ ] E-6. 共有ページに OGP（generateMetadata）を設定する
- [ ] E-7. 共有ページ下部に「SAUNA DAY で休日を作る」CTAを配置する

## Phase F: 検索条件の保存（要件22）

- [ ] F-1. Repository に `listSavedConditions`, `saveCondition`, `deleteCondition` を実装する
- [ ] F-2. 検索結果画面に「この条件を保存」ボタンを追加する（認証チェック付き）
- [ ] F-3. 保存時のラベル入力UI（Sheet で入力欄 + 自動ラベル候補表示）
- [ ] F-4. Server Action `saveSearchCondition`, `deleteSearchCondition` を作成する
- [ ] F-5. `src/components/home/SavedConditionsList.tsx` を作成する
- [ ] F-6. ホーム画面に SavedConditionsList を追加する（認証済み + 1件以上のとき表示）

## Phase G: 既訪問除外（要件23）

- [ ] G-1. `src/lib/search/filter.ts` に既訪問除外ロジックを追加する
- [ ] G-2. 条件設定画面に「行ったことがあるサウナを除く」トグルを追加する
- [ ] G-3. トグルの表示条件: 認証済みのみ。お気に入り0件なら非活性 + 注釈表示
- [ ] G-4. `conditionsFromQuery` / `pathWithConditions` に `excludeVisited` を追加する

## Phase H: 検証

- [ ] H-1. `npm run typecheck` が通ること
- [ ] H-2. `npm run build` が通ること
- [ ] H-3. `npm run test` が通ること（search/filter のユニットテストにエリアフィルタ・既訪問除外のケースを追加）
- [ ] H-4. エリアから探す → 検索結果 → 詳細 → プラン生成 の一連のフローが動作すること
- [ ] H-5. 共有URLが未認証で閲覧でき、is_public = false の場合に 404 になること

---

## 実装順序

```
A（データ基盤）
  ├── B（エリアから探す）
  ├── C（今月のおすすめ）
  ├── D（営業時間チェック）
  ├── E（プラン共有）
  └── F（検索条件の保存）→ G（既訪問除外）
最後に H（検証）
```

A を先に完了させれば B〜G は独立して進められる。
P0（B + C）を先に終わらせ、P1（D + E）、P2（F + G）の順に進める。
