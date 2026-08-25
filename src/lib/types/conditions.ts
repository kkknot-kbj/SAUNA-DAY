import type { TagRef } from './taxonomy';

/** 日帰り / 宿泊 */
export type StayType = 'day_trip' | 'lodging';

/** 誰と行くか */
export type CompanionType = 'solo' | 'couple' | 'friends' | 'family';

/**
 * 必須条件。
 * 満たさない施設は検索結果から除外する。
 * null は「指定なし」= 制約なしとして扱い、除外判定を行わない。
 */
export type RequiredConditions = {
  /** ISO 8601 の日付（YYYY-MM-DD） */
  date: string | null;
  partySize: number | null;
  companion: CompanionType | null;
  /** origins マスタの key */
  originKey: string | null;
  maxTravelMinutes: number | null;
  stayType: StayType | null;
  /** 1人あたりの上限金額 */
  budgetMax: number | null;
  /** 貸切等、満たさなければ除外する絶対条件 */
  absoluteTags: TagRef[];
  /** エリアキー。空配列 = エリア制約なし */
  areaKeys: string[];
  /** 行ったことがあるサウナ（お気に入り済み）を除外するか */
  excludeVisited: boolean;
};

/**
 * 希望条件。
 * 一致数をスコアに加算する。除外はしない。
 */
export type WishConditions = {
  tags: TagRef[];
};

export type SearchConditions = {
  required: RequiredConditions;
  wish: WishConditions;
};

/** 何も指定していない初期状態 */
export const EMPTY_CONDITIONS: SearchConditions = {
  required: {
    date: null,
    partySize: null,
    companion: null,
    originKey: null,
    maxTravelMinutes: null,
    stayType: null,
    budgetMax: null,
    absoluteTags: [],
    areaKeys: [],
    excludeVisited: false,
  },
  wish: { tags: [] },
};

/** 出発地マスタ */
export type Origin = {
  key: string;
  labelJa: string;
  lat: number;
  lng: number;
};

/** 保存した検索条件 */
export type SavedCondition = {
  id: string;
  label: string;
  conditions: SearchConditions;
  createdAt: string;
};
