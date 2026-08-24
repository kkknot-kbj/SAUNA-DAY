import type {
  HolidayPlan,
  LinkedPlaces,
  Origin,
  SaunaDetail,
  SaunaSummary,
  SearchConditions,
  SearchOutcome,
  Weights,
} from '@/lib/types';

/**
 * データアクセスの唯一の窓口。
 *
 * Phase 1 はモック、Phase 2 で Supabase 実装に差し替える。
 * 画面コードはこの interface だけに依存させ、mock/ を直接 import しない。
 */
export type Repository = {
  // ── 検索
  /**
   * 条件に合うサウナを検索する。
   * 必須条件を満たさない施設は除外し、希望条件の一致数と各要素のスコアで並べる。
   * AI は使わない。
   */
  searchSaunas(conditions: SearchConditions): Promise<SearchOutcome>;

  /** 条件に合う件数だけを返す（条件設定画面の件数表示用） */
  countSaunas(conditions: SearchConditions): Promise<number>;

  // ── 施設
  getSaunaBySlug(slug: string): Promise<SaunaDetail | null>;
  getSaunaById(id: string): Promise<SaunaDetail | null>;
  /** id の配列から概要をまとめて取得（行きたい用）。引数の順序を保つ */
  getSaunaSummariesByIds(ids: string[]): Promise<SaunaSummary[]>;
  /** slug の配列から概要をまとめて取得。引数の順序を保つ */
  getSaunaSummariesBySlugs(slugs: string[]): Promise<SaunaSummary[]>;

  // ── 周辺施設
  /** サ飯 / 観光・アクティビティ・温泉 / 宿泊 の候補 */
  getLinkedPlaces(saunaId: string): Promise<LinkedPlaces>;

  // ── マスタ
  listOrigins(): Promise<Origin[]>;
  /** スコアの重み。Phase 2 以降は search_weights から読む */
  getWeights(): Promise<Weights>;

  // ── 行きたい（Phase 3 で実装。Phase 1 は空を返す）
  listFavoriteSaunaIds(): Promise<string[]>;
  addFavorite(saunaId: string): Promise<void>;
  removeFavorite(saunaId: string): Promise<void>;

  // ── 保存プラン（Phase 6 で実装。Phase 1 は空を返す）
  listSavedPlans(): Promise<HolidayPlan[]>;
  getSavedPlan(id: string): Promise<HolidayPlan | null>;
  savePlan(plan: HolidayPlan): Promise<string>;
  deletePlan(id: string): Promise<void>;
};

/** Phase 3 / 6 で実装するメソッドの暫定エラー */
export class NotImplementedYetError extends Error {
  constructor(method: string, phase: string) {
    super(`${method} は ${phase} で実装します`);
    this.name = 'NotImplementedYetError';
  }
}
