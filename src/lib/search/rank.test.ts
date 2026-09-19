import { describe, expect, it } from 'vitest';

import { rankResults } from './rank';

import type { ScoreBreakdown, SearchResultItem } from '@/lib/types';

function item(id: string, total: number): SearchResultItem {
  const score: ScoreBreakdown = {
    conditionMatch: { matched: [], unmatched: [], ratio: 1 },
    distance: { travelMinutes: null, normalized: 0.5 },
    price: { priceMin: null, normalized: 0.5 },
    popularity: { raw: 0, normalized: 0 },
    preference: { matchedTags: [], normalized: 0 },
    total,
  };
  return {
    sauna: {
      id,
      slug: id,
      name: id,
      prefecture: '東京都',
      area: null,
      heroImage: null,
      primaryTags: [],
      priceMin: null,
      travelMinutes: null,
      featuredUntil: null,
      featuredCopy: null,
      saunaTempMax: null,
      coolTempMin: null,
    },
    score,
  };
}

describe('rank — 並び順（要件6-5）', () => {
  it('スコア降順に並ぶ', () => {
    const result = rankResults([item('low', 0.2), item('high', 0.9), item('mid', 0.5)]);
    expect(result.map((i) => i.sauna.id)).toEqual(['high', 'mid', 'low']);
  });

  it('同スコアは slug 昇順で決着する', () => {
    const result = rankResults([item('charlie', 0.5), item('alpha', 0.5), item('bravo', 0.5)]);
    expect(result.map((i) => i.sauna.id)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('入力順が変わっても結果が同じ（決定的）', () => {
    const a = rankResults([item('x', 0.5), item('y', 0.5), item('z', 0.5)]);
    const b = rankResults([item('z', 0.5), item('x', 0.5), item('y', 0.5)]);
    const c = rankResults([item('y', 0.5), item('z', 0.5), item('x', 0.5)]);
    expect(a.map((i) => i.sauna.id)).toEqual(b.map((i) => i.sauna.id));
    expect(b.map((i) => i.sauna.id)).toEqual(c.map((i) => i.sauna.id));
  });

  it('浮動小数の微差は同値として slug で決着する', () => {
    const result = rankResults([item('zebra', 0.5), item('apple', 0.5 + 1e-12)]);
    expect(result.map((i) => i.sauna.id)).toEqual(['apple', 'zebra']);
  });

  it('入力配列を書き換えない', () => {
    const input = [item('b', 0.1), item('a', 0.9)];
    const before = input.map((i) => i.sauna.id);
    rankResults(input);
    expect(input.map((i) => i.sauna.id)).toEqual(before);
  });

  it('空配列でも壊れない', () => {
    expect(rankResults([])).toEqual([]);
  });
});
