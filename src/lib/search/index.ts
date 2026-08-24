import { applyRequiredConditions } from './filter';
import { rankResults } from './rank';
import { suggestRelaxations } from './relax';
import { buildScoringContext, calculateScore } from './score';

import type {
  SaunaDetail,
  SaunaSummary,
  SearchConditions,
  SearchOutcome,
  SearchResultItem,
  Weights,
} from '@/lib/types';

export { applyRequiredConditions, findExclusionReason } from './filter';
export type { ExclusionReason } from './filter';
export { rankResults } from './rank';
export { suggestRelaxations, SCARCE_RESULT_THRESHOLD } from './relax';
export { buildScoringContext, calculateScore, NEUTRAL } from './score';
export type { ScoringContext } from './score';
export {
  DEFAULT_WEIGHTS,
  WEIGHT_KEYS,
  WEIGHT_LABELS,
  getWeights,
  normalizeWeights,
  redistributeForGuest,
} from './weights';
export { collectTagIds, countMatchedTags, hasAllTags, hasTag } from './tags';

/** 詳細から検索結果カード用の情報だけを取り出す */
function toSummary(sauna: SaunaDetail): SaunaSummary {
  return {
    id: sauna.id,
    slug: sauna.slug,
    name: sauna.name,
    prefecture: sauna.prefecture,
    area: sauna.area,
    heroImage: sauna.heroImage,
    primaryTags: sauna.primaryTags,
    priceMin: sauna.priceMin,
    travelMinutes: sauna.travelMinutes,
  };
}

/**
 * 検索の全工程。
 *
 * filter（必須条件で除外） → score（内訳付き） → rank（決定的） → relax（緩和提示）
 *
 * IMPORTANT: AI を経由しない決定的な処理。
 * 同じ入力に対して常に同じ結果を返す。
 */
export function runSearch(
  saunas: readonly SaunaDetail[],
  conditions: SearchConditions,
  weights: Weights,
  preferenceWeights: Map<string, number> = new Map(),
): SearchOutcome {
  const passing = applyRequiredConditions(saunas, conditions.required);
  const context = buildScoringContext(passing, conditions, weights, preferenceWeights);

  const items: SearchResultItem[] = passing.map((sauna) => ({
    sauna: toSummary(sauna),
    score: calculateScore(sauna, conditions, context),
  }));

  return {
    items: rankResults(items),
    totalBeforeFilter: saunas.length,
    suggestions: suggestRelaxations(saunas, conditions),
  };
}
