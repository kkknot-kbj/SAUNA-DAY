# SAUNA DAY MVP — 実装タスク

参照: `requirements.md` / `design.md` / `.kiro/steering/`

各タスク完了時に `.kiro/steering/tech.md` の「完了の基準」を満たすこと（typecheck / build / lint / デザイン規範 / 「不明」表示）。

---

## Phase 1 — UI / ナビゲーション / モックデータ

Supabaseなしで、モックデータ上で検索が機能し、全8画面を通して触れる状態にする。

- [x] **1.1 プロジェクト初期化**
  - Next.js 16（App Router）+ TypeScript を `c:\Users\naota\SAUNA DAY` に構築
  - `tsconfig.json` を `strict: true`、`@/*` エイリアスを設定
  - `lucide-react` を追加（バージョン固定）
  - `npm run typecheck` スクリプトを追加
  - _要件: 該当なし（基盤）_ / _steering: tech.md_

- [x] **1.2 デザイントークンとフォント**
  - `globals.css` に Tailwind v4 `@theme` でトークンを定義（design.md §9）
  - `next/font/google` で Noto Serif JP / Noto Sans JP を読み込み、CSS変数で適用
  - 数値表示用に `tabular-nums` のユーティリティを用意
  - _要件: 19_ / _design: §9_

- [x] **1.3 ドメイン型の定義**
  - `lib/types/` に `conditions.ts` / `sauna.ts` / `search.ts` / `plan.ts` / `linked.ts` を作成
  - 「値なし」は必ず `null`。`undefined` と混在させない
  - _要件: 18_ / _design: §3_

- [x] **1.4 語彙の実装**
  - `lib/taxonomy/terms.ts` に10カテゴリ全選択肢を定義（key / labelJa / icon / sortOrder / isAdvanced）
  - `termsOf` / `labelOf` / `iconOf` を実装
  - 要件3の表と選択肢が1件も欠けていないことを確認
  - _要件: 3_ / _design: §6_

- [x] **1.5 Repository interface**
  - `lib/data/repository.ts` に interface を定義（searchSaunas / getSaunaBySlug / getLinkedPlaces / listFavorites / ...）
  - `lib/data/index.ts` に `getRepository()` を実装（環境変数で切替、Phase 1 はモック固定）
  - _要件: 該当なし（基盤）_ / _steering: structure.md_

- [x] **1.6 モックデータ作成**
  - `mock/saunas.ts` に **20施設以上**。**関東（1都6県）限定**で、県が偏らないよう分散
  - 都心から1時間以内の施設と3時間前後の施設の両方を含める
  - 自然環境 / クールダウン / サウナタイプ / 料金 / 距離 / 貸切 / 体験 をそれぞれ変える
  - **一部施設は `priceMin` / `businessHours` / `waterTempMin` 等を意図的に `null`** にする
  - 「川が近いが入れない」施設と「川に入れる」施設の両方を含める（要件4-5の検証用）
  - `mock/restaurants.ts` / `spots.ts`（sightseeing / activity / onsen）/ `hotels.ts` と紐付けデータ
  - `mock/origins.ts` に関東の出発地（東京 / 横浜 / 大宮 / 千葉 / 立川）の座標
  - 実在の施設名・電話番号・URLを使わない
  - _要件: 20, 4_

- [x] **1.7 所要時間の導出**
  - `lib/utils/distance.ts` に Haversine と分換算を実装
  - 座標が `null` なら `null` を返す
  - _要件: 7-4_ / _design: §4.6_

- [x] **1.8 検索ロジック（純関数）**
  - `lib/search/weights.ts` — `DEFAULT_WEIGHTS`、`getWeights()`、`redistributeForGuest()`、合計1.0への正規化
  - `lib/search/filter.ts` — 必須条件による除外。**`null` の項目では除外しない**
  - `lib/search/score.ts` — 各要素を0..1正規化して重み付き和。内訳を返す。不明値は0.5
  - ランキング — total降順、同値は slug 昇順（決定的）
  - `lib/search/relax.ts` — 移動時間 / 予算 / 希望条件の緩和案と件数
  - _要件: 5, 6, 9_ / _design: §4_

- [x] **1.9 検索ロジックのユニットテスト**
  - Vitest を追加（`--run` で実行）
  - design.md §10 の表の全項目をテスト
  - _要件: 5, 6, 9_ / _design: §10_

- [x] **1.10 UIプリミティブ**
  - `components/ui/` に Button / Chip / Tag / Sheet / Disclosure / Field / Stepper / Stat / EmptyState
  - **`Stat` が `null` を受けたら「不明」を表示する**（各画面に `?? '不明'` を書かせない）
  - `Chip` は選択状態を罫線+チェックでも表す。タップ領域44px以上
  - _要件: 2-7, 18-3, 19_ / _design: §7.1_

- [x] **1.11 レイアウトと下部ナビ**
  - `components/layout/` に `PageShell` / `AppHeader` / `BottomNav`
  - `BottomNav` は **探す / 行きたい / プラン の3項目のみ**。現在位置を色以外でも示す
  - `app/layout.tsx` に組み込む
  - _要件: 16_ / _design: §7.2_

- [x] **1.12 状態管理**
  - `lib/state/conditions-context.tsx` — Context + `useReducer`、URLクエリへの反映
  - `lib/state/guest-storage.ts` — `localStorage` に conditions / recentlyViewed / pendingFavorite
  - _要件: 2-9, 13-3, 15-5_ / _design: §8_

- [x] **1.13 ホーム画面**
  - メインコピー「次の休日、サウナから決めよう。」を明朝で最大の要素として配置
  - 5項目（いつ / 誰と / どこから / 日帰り・宿泊 / 移動可能時間）の入力フロー
  - 未入力でも検索へ進める
  - 直近閲覧を控えめに表示
  - 会員登録を要求しない。AIへの言及を置かない
  - _要件: 1_

- [x] **1.14 条件設定画面**
  - 必須 / 希望 / 詳細 の3階層。初期表示は必須+希望のみ
  - 詳細は `Disclosure`「条件を追加」で展開
  - 語彙配列から `ChipGroup` を生成（画面に日本語ラベルを直書きしない）
  - 条件変更時に現在の件数を表示
  - _要件: 2, 3_ / _design: §6_

- [x] **1.15 検索結果画面**
  - `SaunaCard` — 大きな写真 / 施設名 / 主要タグ3〜4件 / 条件一致率 / 所要時間 / 料金
  - 料金・所要時間が `null` なら「不明」。所要時間は「目安」と分かる表記
  - 余白のあるリスト形式（カードを敷き詰めない）
  - `WhyRankedSheet` — スコア内訳と一致/不一致条件を表示
  - `RelaxSuggestionBar` — 上位1〜2件のみ。0件時は必ず表示
  - _要件: 7, 8, 9_ / _design: §7.2_

- [x] **1.16 サウナ詳細画面**
  - 写真を上部の主役に。要件10-1の全項目を `SpecTable` / `Stat` で表示
  - `CooldownList` — 種類ごとに水温 / 水深 / 飛び込み可否。`can_dive` の `null` と `false` を区別
  - 「このサウナで休日を作る」ボタンを配置
  - `FavoriteButton`（Phase 3 で保存を接続）
  - 予約URLがある施設のみ外部遷移リンクを表示
  - _要件: 10, 17_

- [x] **1.17 残り4画面の骨格**
  - 休日プラン / 行きたい / 保存プラン / 認証 を、モックデータで表示できる状態にする
  - 空状態は `EmptyState` で次の行動を1つだけ示す
  - _要件: 12, 13, 14, 15_

- [x] **1.18 Phase 1 の通し確認**
  - 8画面すべてに下部ナビから到達できる
  - 条件を変えると検索結果が変わる
  - `null` の項目が「不明」と表示される
  - `design-principles.md` の禁止事項に触れていない（絵文字 / グラデ / 過剰な丸角 / カードの敷き詰め）
  - _要件: 19, 20-4_

---

## Phase 2 — Supabase DB / 検索 / フィルタ

- [ ] **2.1 マイグレーション作成**
  - `supabase/migrations/0001_init.sql` に design.md §2.3 のDDLを実装
  - enum / 複合FK / index / check制約を含める
  - _design: §2.3_

- [ ] **2.2 seed 投入**
  - `supabase/seed.sql` に `taxonomy_terms` 全件、`search_weights` 初期値、`origins`
  - Phase 1 のモックデータを seed に変換
  - _要件: 3, 6-2, 20_

- [ ] **2.3 Supabase クライアント設定**
  - `.env.local`（commitしない）と型生成
  - _steering: tech.md_

- [ ] **2.4 supabase-repository の実装**
  - `lib/data/supabase-repository.ts` を interface に沿って実装
  - 必須条件の絞り込みをSQL側へ。`score.ts` のシグネチャは変えない
  - `getRepository()` の切替を有効化
  - _要件: 5_ / _design: §4.1_

- [ ] **2.5 RLS 設定**
  - 施設系テーブルは anon に select 許可（未登録で検索できる要件）
  - ユーザー系は本人のみ
  - _要件: 15-7_ / _design: §2.4_

- [ ] **2.6 重みのDB化**
  - `getWeights()` を `search_weights` から読むよう変更。取得失敗時は `DEFAULT_WEIGHTS`
  - _要件: 6-3_

- [ ] **2.7 差し替えの検証**
  - 画面コードを変更せずにモック→Supabaseへ切り替わることを確認
  - 検索結果がモック時と一致することを確認

---

## Phase 3 — サウナ詳細 / 行きたい

- [ ] **3.1 詳細画面をDB接続に切替** — _要件: 10_
- [ ] **3.2 favorites の保存・解除**（Server Action） — _要件: 13-1, 13-5_
- [ ] **3.3 行きたい一覧** — 保存済み一覧、空状態、地域整理を見据えた構造 — _要件: 13-4, 13-6, 13-7_
- [ ] **3.4 ゲスト時の保存導線** — `pendingFavorite` を保持して認証へ送る — _要件: 13-2_

---

## Phase 4 — 認証

- [ ] **4.1 Supabase Auth 設定** — Apple / Google プロバイダ — _要件: 15-4_
- [ ] **4.2 認証画面** — 見出し「行きたいを保存しよう」、2ボタンのみ。**メール/パスワードを置かない** — _要件: 15-1〜15-3_
- [ ] **4.3 profiles の自動作成** — 初回サインイン時 — _design: §2.3_
- [ ] **4.4 ゲスト状態の移行** — `pendingFavorite` を保存へ、conditions を profiles へ、localStorage を破棄 — _要件: 15-5, 13-3_
- [ ] **4.5 未認証の継続確認** — 検索・閲覧・詳細・プラン生成で認証を求めないことを確認 — _要件: 15-6, 15-7_
- [ ] **4.6 preference スコアの有効化** — favorites からタグ分布を集計 — _要件: 6-1_ / _design: §8.3_

---

## Phase 5 — サ飯 / 観光 / 宿泊の関連付け

- [ ] **5.1 周辺施設テーブルへのデータ投入** — restaurants / spots / hotels と中間テーブル — _要件: 11_
- [ ] **5.2 `getLinkedPlaces` の実装** — 距離・移動時間・おすすめ度を含めて取得 — _要件: 11-2〜11-4_
- [ ] **5.3 詳細画面での表示** — `LinkedPlaceList`。**サウナ本体より下位の扱い** — _要件: 11-6_

---

## Phase 6 — 休日プラン生成（AIなし）

- [ ] **6.1 候補収集** — `lib/plan/candidates.ts`。日帰り指定なら hotels を除外 — _要件: 12-1, 12-7_
- [ ] **6.2 決定的なプラン組み立て** — 営業時間と移動時間から順序と時刻を決める — _design: §5.4_
- [ ] **6.3 検証** — `lib/plan/validate.ts` の5項目 — _要件: 12-6_ / _design: §5.3_
- [ ] **6.4 検証のユニットテスト** — 候補外refIdの破棄、日帰りhotel破棄、サウナ本体の補完 — _design: §10_
- [ ] **6.5 プラン画面** — `Timeline`。サウナが中心であることが視覚的に明確 — _要件: 12-4, 12-8_
- [ ] **6.6 プラン保存** — `saved_plans` + `plan_items`。**施設名・料金を保存しない** — _要件: 12-10, 14-1, 14-2_
- [ ] **6.7 保存プラン一覧・詳細・削除** — 表示時にDBから施設情報を解決。参照喪失時は「情報が取得できません」 — _要件: 14-3〜14-7_

---

## Phase 7 — AI統合

- [ ] **7.1 LLM プロバイダの選定** — 決定内容を design.md §11 に反映
- [ ] **7.2 `lib/plan/prompt.ts`** — `PlanInput` の組み立て。**DB由来の値のみ**。IDを必ず添える — _要件: 12-2_ / _design: §5.2_
- [ ] **7.3 出力スキーマの強制** — `PlanOutput`（startTime / refType / refId / note のみ）。施設名フィールドを持たせない — _要件: 12-3_
- [ ] **7.4 Phase 6 の組み立てをLLMに差し替え** — `validate.ts` は共通で通す — _design: §5.4_
- [ ] **7.5 UIの文言確認** — 「AI」「生成」を含めない。ローディングは「休日を組み立てています」 — _要件: 12-9_ / _steering: product.md_
- [ ] **7.6 捏造の検証** — 候補外の施設名・料金・営業時間が表示され得ないことを確認 — _要件: 18-2, 18-5_
- [ ] **7.7 フォールバック** — LLM失敗時は Phase 6 の決定的ロジックで組む

---

## 進め方

- **Phase 1 を完了させてから Phase 2 に進む。** 並行して進めない
- 各 Phase の終わりに、対応する要件の受入基準を1つずつ突き合わせる
- ビルドが通ることは完了の証明ではない。要件との照合を別途行う
- 設計の変更が必要になったら、実装を進める前に `design.md` を更新する
