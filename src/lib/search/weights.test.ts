import { describe, expect, it } from 'vitest';

import {
  DEFAULT_WEIGHTS,
  WEIGHT_KEYS,
  normalizeWeights,
  redistributeForGuest,
} from './weights';

import type { Weights } from '@/lib/types';

function sum(weights: Weights): number {
  return WEIGHT_KEYS.reduce((total, key) => total + weights[key], 0);
}

describe('weights — 重みの外部化（要件6）', () => {
  it('初期値が仕様どおり（55/20/10/10/5）', () => {
    expect(DEFAULT_WEIGHTS).toEqual({
      condition_match: 0.55,
      distance: 0.2,
      price: 0.1,
      popularity: 0.1,
      preference: 0.05,
    });
  });

  it('初期値の合計が 1.0', () => {
    expect(sum(DEFAULT_WEIGHTS)).toBeCloseTo(1, 10);
  });

  describe('normalizeWeights', () => {
    it('合計が 1 でない設定を 1 に揃える', () => {
      const raw: Weights = {
        condition_match: 55,
        distance: 20,
        price: 10,
        popularity: 10,
        preference: 5,
      };
      const normalized = normalizeWeights(raw);
      expect(sum(normalized)).toBeCloseTo(1, 10);
      expect(normalized.condition_match).toBeCloseTo(0.55, 10);
    });

    it('比率を保つ', () => {
      const raw: Weights = {
        condition_match: 4,
        distance: 2,
        price: 1,
        popularity: 1,
        preference: 0,
      };
      const n = normalizeWeights(raw);
      expect(n.condition_match / n.distance).toBeCloseTo(2, 10);
      expect(n.preference).toBe(0);
    });

    it('全て 0 なら既定値に戻す', () => {
      const zero: Weights = {
        condition_match: 0,
        distance: 0,
        price: 0,
        popularity: 0,
        preference: 0,
      };
      expect(normalizeWeights(zero)).toEqual(DEFAULT_WEIGHTS);
    });

    it('入力を書き換えない', () => {
      const raw: Weights = { ...DEFAULT_WEIGHTS, condition_match: 10 };
      const copy = { ...raw };
      normalizeWeights(raw);
      expect(raw).toEqual(copy);
    });
  });

  describe('redistributeForGuest（要件6-6）', () => {
    it('preference が 0 になる', () => {
      expect(redistributeForGuest(DEFAULT_WEIGHTS).preference).toBe(0);
    });

    it('合計は 1.0 のまま', () => {
      expect(sum(redistributeForGuest(DEFAULT_WEIGHTS))).toBeCloseTo(1, 10);
    });

    it('他要素へ比例配分される（要素間の比が保たれる）', () => {
      const guest = redistributeForGuest(DEFAULT_WEIGHTS);
      const before = DEFAULT_WEIGHTS.condition_match / DEFAULT_WEIGHTS.distance;
      const after = guest.condition_match / guest.distance;
      expect(after).toBeCloseTo(before, 10);
    });

    it('各要素が増える（減らない）', () => {
      const guest = redistributeForGuest(DEFAULT_WEIGHTS);
      for (const key of WEIGHT_KEYS) {
        if (key === 'preference') continue;
        expect(guest[key]).toBeGreaterThan(DEFAULT_WEIGHTS[key]);
      }
    });

    it('preference が既に 0 なら何も変わらない', () => {
      const noPreference = normalizeWeights({ ...DEFAULT_WEIGHTS, preference: 0 });
      expect(redistributeForGuest(noPreference)).toEqual(noPreference);
    });

    it('preference だけに重みがある異常設定でも壊れない', () => {
      const odd: Weights = {
        condition_match: 0,
        distance: 0,
        price: 0,
        popularity: 0,
        preference: 1,
      };
      const result = redistributeForGuest(odd);
      expect(result.preference).toBe(0);
      expect(sum(result)).toBeCloseTo(1, 10);
    });
  });
});
