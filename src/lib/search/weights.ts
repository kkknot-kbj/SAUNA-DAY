import type { WeightKey, Weights } from '@/lib/types';

/**
 * スコアの重み。
 *
 * IMPORTANT: 画面やスコア計算にこの値を直接書かない。
 * Phase 2 以降は search_weights テーブルから読み、デプロイなしで変更できるようにする。
 */
export const DEFAULT_WEIGHTS: Weights = {
  condition_match: 0.55,
  distance: 0.2,
  price: 0.1,
  popularity: 0.1,
  preference: 0.05,
};

export const WEIGHT_KEYS: readonly WeightKey[] = [
  'condition_match',
  'distance',
  'price',
  'popularity',
  'preference',
];

/** 表示用のラベル（「なぜこの順番？」で使う） */
export const WEIGHT_LABELS: Record<WeightKey, string> = {
  condition_match: '条件一致',
  distance: '距離',
  price: '料金',
  popularity: '人気',
  preference: '過去の選択',
};

function sumOf(weights: Weights): number {
  return WEIGHT_KEYS.reduce((total, key) => total + weights[key], 0);
}

/**
 * 合計を 1.0 に揃える。
 * 重みを外部から差し替える前提なので、合計がずれていても壊れないようにする。
 * 全て 0 の場合は既定値に戻す。
 */
export function normalizeWeights(weights: Weights): Weights {
  const sum = sumOf(weights);
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  if (Math.abs(sum - 1) < 1e-9) return { ...weights };

  const normalized = {} as Weights;
  for (const key of WEIGHT_KEYS) {
    normalized[key] = weights[key] / sum;
  }
  return normalized;
}

/**
 * ゲスト（または favorites が0件のユーザー）向けに preference の重みを他要素へ比例配分する。
 * 過去の選択がない相手に preference で差をつけるのは意味がないため。
 */
export function redistributeForGuest(weights: Weights): Weights {
  const base = normalizeWeights(weights);
  const preference = base.preference;
  if (preference <= 0) return base;

  const others = WEIGHT_KEYS.filter((key) => key !== 'preference');
  const othersSum = others.reduce((total, key) => total + base[key], 0);

  // preference しか重みがない異常な設定では既定値に戻す。
  // preference を落とした分だけ合計が 1 を割るので正規化を通す
  if (othersSum <= 0) return normalizeWeights({ ...DEFAULT_WEIGHTS, preference: 0 });

  const result = { preference: 0 } as Weights;
  for (const key of others) {
    result[key] = base[key] + (preference * base[key]) / othersSum;
  }
  return normalizeWeights(result);
}

/**
 * 重みを取得する。
 * Phase 1 は既定値。Phase 2 以降は search_weights から読み、失敗時は既定値にフォールバックする。
 */
export async function getWeights(): Promise<Weights> {
  return normalizeWeights(DEFAULT_WEIGHTS);
}
