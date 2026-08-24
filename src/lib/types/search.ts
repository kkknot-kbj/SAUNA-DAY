import type { SaunaSummary } from './sauna';
import type { TagRef } from './taxonomy';

/** スコアの重み。合計を 1.0 に保つ */
export type Weights = {
  condition_match: number;
  distance: number;
  price: number;
  popularity: number;
  preference: number;
};

export type WeightKey = keyof Weights;

/**
 * スコアの内訳。
 * 「なぜこの順番？」の表示元になるので、総合値だけでなく各要素を保持する。
 */
export type ScoreBreakdown = {
  conditionMatch: {
    matched: TagRef[];
    unmatched: TagRef[];
    /** matched / 指定された希望条件数。指定0件なら 1 */
    ratio: number;
  };
  distance: {
    travelMinutes: number | null;
    /** 0..1。null は 0.5（中立） */
    normalized: number;
  };
  price: {
    priceMin: number | null;
    normalized: number;
  };
  popularity: {
    raw: number;
    normalized: number;
  };
  preference: {
    matchedTags: TagRef[];
    normalized: number;
  };
  /** 重み付き和。0..1 */
  total: number;
};

export type SearchResultItem = {
  sauna: SaunaSummary;
  score: ScoreBreakdown;
};

/** 条件を緩和した場合に増える候補の提示 */
export type RelaxSuggestion = {
  /**
   * - travel_time / budget: 必須条件の数値を緩める
   * - drop_must_tag: 必須にしたタグを1つ希望に落とす（除外をやめる）
   * - drop_all_must_tags: 必須をすべて希望に落とす。1つ外しても0件のときの最終手段
   * - drop_wish_tag: 希望条件を1つ外して一致率を上げる
   */
  kind: 'travel_time' | 'budget' | 'drop_must_tag' | 'drop_all_must_tags' | 'drop_wish_tag';
  /** 「あと30分移動できれば」 */
  label: string;
  /** 緩和量。タグ系では null */
  delta: number | null;
  /** 外すタグ。数値系では null */
  droppedTag: TagRef | null;
  /** 緩和で増える件数 */
  additionalCount: number;
  /** 緩和後の最良一致率の表示用文字列（例 "10/10"） */
  bestMatchRatio: string;
};

export type SearchOutcome = {
  items: SearchResultItem[];
  /** 必須条件で除外される前の総数 */
  totalBeforeFilter: number;
  suggestions: RelaxSuggestion[];
};
