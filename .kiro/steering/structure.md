---
inclusion: always
---

# ファイル構成と命名規約

## ディレクトリ構成

```
src/
  app/                              # 画面（App Router）
    layout.tsx                      # フォント読込・下部ナビ配置
    page.tsx                        # 1. 探す（ホーム）
    search/
      conditions/page.tsx           # 2. 条件設定
      results/page.tsx              # 3. 検索結果
    saunas/[slug]/page.tsx          # 4. サウナ詳細
    plans/
      new/page.tsx                  # 5. 休日プラン（生成・確認）
      page.tsx                      # 7. 保存プラン一覧
      [id]/page.tsx                 #    保存プラン詳細
    favorites/page.tsx              # 6. 行きたい
    auth/page.tsx                   # 8. 認証

  components/
    layout/                         # BottomNav, AppHeader, PageShell
    ui/                             # 汎用プリミティブ（Button, Chip, Tag, Sheet, Field, Disclosure, Stat）
    search/                         # ConditionGroup, ChipGroup, StepperField, RelaxSuggestion, WhyRanked
    sauna/                          # SaunaCard, SaunaHero, SpecTable, MatchScore, LinkedList
    plan/                           # Timeline, TimelineItem, PlanHeader

  lib/
    types/                          # ドメイン型（sauna.ts, plan.ts, conditions.ts, linked.ts）
    taxonomy/terms.ts               # 全タグ語彙（key / 和名ラベル / lucideアイコン名 / 表示順）
    data/
      repository.ts                 # データアクセスの interface
      mock-repository.ts            # Phase 1 実装
      supabase-repository.ts        # Phase 2 実装
      index.ts                      # 実装の選択（環境変数で切替）
    search/
      filter.ts                     # 必須条件による除外
      score.ts                      # スコア計算（内訳を返す）
      weights.ts                    # 重みの取得（外部化）
      relax.ts                      # 条件緩和の候補数算出
    plan/
      candidates.ts                 # DBから候補を集める
      validate.ts                   # AI出力の refId 検証
      prompt.ts                     # Phase 7。AIへ渡す入力の組み立て
    state/
      conditions-context.tsx        # 検索条件の保持
      guest-storage.ts              # 未ログイン時の端末保存
    utils/                          # format.ts（料金・時間・「不明」表示）, distance.ts

  mock/                             # モックデータ（saunas.ts, restaurants.ts, spots.ts, hotels.ts）

supabase/
  migrations/                       # 0001_init.sql 等。連番 + 内容名
  seed.sql

public/images/                      # 施設写真（Phase 1 はプレースホルダ）
```

## レイヤー境界

依存の向きは一方向に保つ。

```
app/  →  components/  →  lib/
                ↓            ↓
             lib/types    lib/types
```

- **`lib/` から `components/` や `app/` を import しない**
- `components/ui/` はドメインを知らない。サウナ固有の型を受け取らない
- `components/sauna/` `components/search/` `components/plan/` はドメインを知ってよい
- **画面（`app/`）に検索ロジックを書かない。** 必ず `lib/search/` の関数を呼ぶ
- **コンポーネントから `mock/` を直接 import しない。** 必ず `lib/data/` 経由

## IMPORTANT: データアクセスは Repository 経由

Phase 1 はモック、Phase 2 で Supabase に差し替える。画面コードを書き換えずに移行するため、`lib/data/repository.ts` の interface だけを画面から使う。

```ts
// OK
import { getRepository } from '@/lib/data';
const saunas = await getRepository().searchSaunas(conditions);

// NG — モックに直結しており Phase 2 で全画面を書き換えることになる
import { mockSaunas } from '@/mock/saunas';
```

## 命名規約

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネントファイル | PascalCase | `SaunaCard.tsx` |
| それ以外の `.ts` | kebab-case | `mock-repository.ts`, `guest-storage.ts` |
| ディレクトリ | kebab-case | `search/conditions/` |
| 型・コンポーネント | PascalCase | `type SaunaSummary`, `SaunaCard` |
| 関数・変数 | camelCase | `calculateMatchScore` |
| 定数 | UPPER_SNAKE_CASE | `DEFAULT_WEIGHTS` |
| タグの key | snake_case（英語） | `self_loyly`, `river_dive` |
| DBテーブル・カラム | snake_case（複数形テーブル） | `sauna_cooldowns`, `water_temp_min` |

タグの key は英語 snake_case で保持し、**日本語表示名は `taxonomy/terms.ts` だけが持つ**。
画面に日本語ラベルをハードコードしない（コピー・見出しは除く）。

## import 規約

- `@/` エイリアスを使う（`../../` を辿らない）
- import 順は：外部パッケージ → `@/lib` → `@/components` → 相対パス → 型
- 型は `import type` で分ける

## コンポーネントの粒度

- 1ファイル1コンポーネント。200行を超えたら分割を検討する
- Props は5個を超えたらオブジェクトにまとめるか、コンポーネント分割を検討する
- `'use client'` を付けたファイルは、その配下も全てクライアントになる。**インタラクティブな末端に寄せる**

## ファイルを新規作成する前に

1. `components/ui/` に使える既有プリミティブがないか確認する
2. `taxonomy/terms.ts` に語彙を追加すれば済まないか確認する
3. **既存コンポーネントの拡張で足りるなら新規作成しない**（`design-principles.md` の一貫性要件）

## ドキュメント

- 仕様・設計・タスクは `.kiro/specs/sauna-day-mvp/` に置く
- 横断ルールは `.kiro/steering/` に置く
- **README 等のドキュメントを勝手に増やさない。** 依頼された場合のみ作成する
