import { tagId } from '@/lib/types';
import { DEFAULT_TRAVEL_BASELINE_MINUTES } from '@/lib/utils/distance';

import { collectTagIds } from './tags';
import { normalizeWeights } from './weights';

import type {
  SaunaDetail,
  ScoreBreakdown,
  SearchConditions,
  TagRef,
  Weights,
} from '@/lib/types';

/** 不明な値に与える中立の点。0 にすると情報欠損が減点になってしまう */
export const NEUTRAL = 0.5;

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * スコア計算に必要な、候補集合全体から決まる情報。
 * 料金の正規化は集合内の最小〜最大を使うため、個別施設だけでは決まらない。
 */
export type ScoringContext = {
  weights: Weights;
  /** 距離の基準。未指定なら既定値 */
  travelBaselineMinutes: number;
  /** 候補集合内の料金レンジ。全て不明なら null */
  priceRange: { min: number; max: number } | null;
  /** タグごとの嗜好の強さ（0..1）。ゲストは空 */
  preferenceWeights: Map<string, number>;
};

export function buildScoringContext(
  saunas: readonly SaunaDetail[],
  conditions: SearchConditions,
  weights: Weights,
  preferenceWeights: Map<string, number> = new Map(),
): ScoringContext {
  const prices = saunas
    .map((sauna) => sauna.priceMin)
    .filter((price): price is number => price !== null);

  return {
    weights: normalizeWeights(weights),
    travelBaselineMinutes:
      conditions.required.maxTravelMinutes ?? DEFAULT_TRAVEL_BASELINE_MINUTES,
    priceRange:
      prices.length === 0 ? null : { min: Math.min(...prices), max: Math.max(...prices) },
    preferenceWeights,
  };
}

/** 希望条件のうち、施設が満たしたもの・満たさなかったもの */
function evaluateConditionMatch(
  sauna: SaunaDetail,
  wishTags: TagRef[],
): ScoreBreakdown['conditionMatch'] {
  if (wishTags.length === 0) {
    // 希望条件が未指定なら、一致率で差をつけない
    return { matched: [], unmatched: [], ratio: 1 };
  }

  const ids = collectTagIds(sauna);
  const matched: TagRef[] = [];
  const unmatched: TagRef[] = [];

  for (const ref of wishTags) {
    if (ids.has(tagId(ref))) matched.push(ref);
    else unmatched.push(ref);
  }

  return { matched, unmatched, ratio: matched.length / wishTags.length };
}

/** 近いほど高い。不明は中立 */
function evaluateDistance(
  sauna: SaunaDetail,
  baselineMinutes: number,
): ScoreBreakdown['distance'] {
  if (sauna.travelMinutes === null) {
    return { travelMinutes: null, normalized: NEUTRAL };
  }
  const normalized =
    baselineMinutes <= 0 ? NEUTRAL : clamp01(1 - sauna.travelMinutes / baselineMinutes);
  return { travelMinutes: sauna.travelMinutes, normalized };
}

/** 安いほど高い。不明は中立 */
function evaluatePrice(
  sauna: SaunaDetail,
  priceRange: ScoringContext['priceRange'],
): ScoreBreakdown['price'] {
  if (sauna.priceMin === null || priceRange === null) {
    return { priceMin: sauna.priceMin, normalized: NEUTRAL };
  }
  const { min, max } = priceRange;
  if (max <= min) {
    // 候補の料金が全て同じなら差をつけられない
    return { priceMin: sauna.priceMin, normalized: NEUTRAL };
  }
  return {
    priceMin: sauna.priceMin,
    normalized: clamp01((max - sauna.priceMin) / (max - min)),
  };
}

/** 過去の選択との一致。ゲストは 0（重みが他へ再配分されているため影響しない） */
function evaluatePreference(
  sauna: SaunaDetail,
  preferenceWeights: Map<string, number>,
): ScoreBreakdown['preference'] {
  if (preferenceWeights.size === 0) {
    return { matchedTags: [], normalized: 0 };
  }

  const ids = collectTagIds(sauna);
  const matchedTags: TagRef[] = [];
  let matchedSum = 0;
  let totalSum = 0;

  for (const [id, weight] of preferenceWeights) {
    totalSum += weight;
    if (!ids.has(id)) continue;

    const [category, key] = id.split(':');
    if (category === undefined || key === undefined) continue;
    matchedTags.push({ category, key } as TagRef);
    matchedSum += weight;
  }

  return {
    matchedTags,
    normalized: totalSum <= 0 ? 0 : clamp01(matchedSum / totalSum),
  };
}

/**
 * 1施設のスコアを計算する。副作用なし。
 * 総合値だけでなく各要素の内訳を返し、「なぜこの順番？」に使う（要件6-4）。
 */
export function calculateScore(
  sauna: SaunaDetail,
  conditions: SearchConditions,
  context: ScoringContext,
): ScoreBreakdown {
  const conditionMatch = evaluateConditionMatch(sauna, conditions.wish.tags);
  const distance = evaluateDistance(sauna, context.travelBaselineMinutes);
  const price = evaluatePrice(sauna, context.priceRange);
  const popularity = {
    raw: sauna.popularityScore,
    normalized: clamp01(sauna.popularityScore),
  };
  const preference = evaluatePreference(sauna, context.preferenceWeights);

  const w = context.weights;
  const total =
    conditionMatch.ratio * w.condition_match +
    distance.normalized * w.distance +
    price.normalized * w.price +
    popularity.normalized * w.popularity +
    preference.normalized * w.preference;

  return { conditionMatch, distance, price, popularity, preference, total };
}
