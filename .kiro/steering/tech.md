---
inclusion: always
---

# 技術スタックと開発ルール

## スタック

| 領域 | 選定 | バージョン方針 |
|---|---|---|
| Framework | **Next.js**（App Router） | 16.x（現行安定 16.3.1） |
| 言語 | **TypeScript** | `strict: true` 必須 |
| UI | **React** | Next.js 同梱版に従う |
| Styling | **Tailwind CSS** | 4.x。トークンは `@theme` で定義 |
| Icons | **lucide-react** | これ以外のアイコンパッケージを追加しない |
| DB / Auth / Storage | **Supabase**（PostgreSQL） | Phase 2 以降 |
| 状態管理 | React Context + `useReducer` | 外部ライブラリを入れない |
| 日付 | ネイティブ `Intl` / `Temporal` 相当の薄いユーティリティ | moment / dayjs を入れない |

Node.js は 24.x 系を前提とする。

### なぜ Web（Next.js）か

会員登録前の閲覧・検索が主要導線なので、インストール不要で到達できるWebが最も摩擦が低い。
将来ネイティブ化する場合に備え、型定義と検索ロジック（`src/lib/`）はUIから独立させ、移植可能に保つ。

## コマンド

```powershell
npm run dev        # 開発サーバー（ユーザーが手動で起動する）
npm run build      # 本番ビルド。型エラーもここで出る
npm run start      # ビルド済みを起動
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

**IMPORTANT: エージェントは `npm run dev` を実行しない。** 常駐プロセスなのでセッションをブロックする。
起動が必要な場合はユーザーに依頼する。検証は `npm run build` と `npm run typecheck` で行う。

## IMPORTANT: 日本語フォントは `next/font/google` を使わない

`src/app/layout.tsx` で Google Fonts の stylesheet を `<link>` 参照する。**`next/font/google` に戻してはいけない。**

理由：

1. 日本語フォントは `unicode-range` で **200以上のファイルに分割**されている
2. `next/font/google` はそれを**ビルド時に全部ダウンロード**しようとする
3. 1ファイルでも取得に失敗すると `Module not found` になり、**ビルドと dev が 500 で落ちる**（実際に発生した）
4. `subsets` で絞ろうとしても、Google Fonts のメタデータに日本語フォントの `japanese` subset は登録されていない（`cyrillic` / `latin` / `latin-ext` / `vietnamese` のみ）。`subsets: ['latin']` と書くと日本語の `@font-face` が除外され、**UI全体がシステムフォントにフォールバックする**

現在の実装：

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;600&display=swap"
/>
```

ブラウザが `unicode-range` を見て必要な塊だけ取得するので、実際の転送量は小さい。
フォント名は `globals.css` の `--font-serif` / `--font-sans` に持たせ、OS の日本語フォントへフォールバックさせる。

第三者（fonts.googleapis.com）へのリクエストを避ける必要が出たら、サブセット化した woff2 を自前に置いて `next/font/local` へ移す。その場合もビルド時のネットワーク取得は発生しない。

## 依存追加のルール

- **追加前に必要性を説明する。** 標準機能や数十行の自作で済むものは入れない
- バージョンは**固定**（`^` や `~` を付けない）
- UIコンポーネントライブラリ（MUI / Chakra / shadcn 等）は入れない。デザイン規範を満たすため自作する
- アニメーションライブラリは入れない。必要なら CSS transition で足りる範囲に留める

## TypeScript 規約

- `any` 禁止。不明な型は `unknown` から絞り込む
- DBの「値なし」は `null` で表す。`undefined` と混在させない（`data-integrity.md` 参照）
- 公開する型は `src/lib/types/` に置き、コンポーネントから直接DB行型を触らせない
- エクスポートする関数・コンポーネントには JSDoc を付ける
- Props は `type` で定義し、コンポーネントと同ファイルに置く

## Next.js の使い方

- 既定は Server Component。`'use client'` は状態・イベントが必要な最小単位にだけ付ける
- 条件設定のようなインタラクティブな塊は、Client Component をリーフに寄せる
- データ取得は Server Component か Server Action。クライアントから直接 Supabase を叩かない（認証済みユーザー操作を除く）
- 画像は `next/image`。`alt` 必須

## Supabase（Phase 2 以降）

- スキーマ変更は必ず `supabase/migrations/` にSQLファイルとして追加する。ダッシュボードでの直接変更を正としない
- **全テーブルで RLS を有効化する。** `favorites` / `saved_plans` / `profiles` は本人のみ読み書き可
- `saunas` および関連マスタは匿名ユーザーに読み取りのみ許可（未登録で検索できる要件のため）
- サービスロールキーをクライアントに露出させない。`.env.local` は commit しない

## テスト

- 検索のフィルタ・スコアリング（`src/lib/search/`）は**純関数として実装し、ユニットテストを書く**。ここが壊れるとプロダクトの価値が消える
- UIの網羅的テストはMVPでは求めない
- テストランナーは Vitest。watch モードではなく `--run` で実行する

## 完了の基準

作業を「完了」と報告する前に：

1. `npm run typecheck` が通る
2. `npm run build` が通る
3. `npm run lint` が通る
4. 変更した画面が `design-principles.md` の禁止事項に触れていない
5. 事実情報の欠損が「不明」と表示される（`data-integrity.md`）

ビルドが通ることは正しさの証明ではない。要件との突き合わせを別途行う。
