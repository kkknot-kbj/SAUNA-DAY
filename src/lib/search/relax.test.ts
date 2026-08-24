import { describe, expect, it } from 'vitest';

import { conditions, coolOf, envOf, makeSauna } from './fixtures';
import { applyRequiredConditions } from './filter';
import { suggestRelaxations } from './relax';

import type { SaunaDetail, TagRef } from '@/lib/types';

const RIVER: TagRef = { category: 'cooldown', key: 'river' };
const FOREST: TagRef = { category: 'environment', key: 'forest' };
const SNOW: TagRef = { category: 'cooldown', key: 'snow' };

/** 近い施設1件、少し遠い施設3件（すべて希望条件を満たす） */
function saunasNearAndFar(): SaunaDetail[] {
  return [
    makeSauna({
      id: 'near',
      travelMinutes: 50,
      cooldowns: [coolOf('river')],
      environments: [envOf('forest', 'on_site')],
    }),
    ...[1, 2, 3].map((n) =>
      makeSauna({
        id: `far${n}`,
        travelMinutes: 100 + n,
        cooldowns: [coolOf('river')],
        environments: [envOf('forest', 'on_site')],
      }),
    ),
  ];
}

describe('relax — 条件緩和の提示（要件9）', () => {
  it('移動時間を緩和すると増える件数を提示する', () => {
    const all = saunasNearAndFar();
    const c = conditions({
      required: { maxTravelMinutes: 60 },
      wish: [RIVER, FOREST],
    });

    // 現状は near だけ
    expect(applyRequiredConditions(all, c.required)).toHaveLength(1);

    const suggestions = suggestRelaxations(all, c);
    const travel = suggestions.find((s) => s.kind === 'travel_time');

    expect(travel).toBeDefined();
    expect(travel?.additionalCount).toBe(3);
    expect(travel?.bestMatchRatio).toBe('2/2');
    expect(travel?.label).toContain('移動できれば');
  });

  it('ラベルが「あと30分移動できれば」の形になる', () => {
    const all = saunasNearAndFar();
    const c = conditions({ required: { maxTravelMinutes: 60 }, wish: [RIVER, FOREST] });
    const travel = suggestRelaxations(all, c).find((s) => s.kind === 'travel_time');
    expect(travel?.label).toBe('あと1時間移動できれば');
    expect(travel?.delta).toBe(60);
  });

  it('予算を緩和すると増える件数を提示する', () => {
    const all = [
      makeSauna({ id: 'cheap', priceMin: 3000, cooldowns: [coolOf('river')] }),
      makeSauna({ id: 'mid1', priceMin: 4500, cooldowns: [coolOf('river')] }),
      makeSauna({ id: 'mid2', priceMin: 4800, cooldowns: [coolOf('river')] }),
    ];
    const c = conditions({ required: { budgetMax: 4000 }, wish: [RIVER] });

    const budget = suggestRelaxations(all, c).find((s) => s.kind === 'budget');
    expect(budget).toBeDefined();
    expect(budget?.additionalCount).toBe(2);
    expect(budget?.label).toContain('予算をあと');
  });

  it('希望条件を外すと完全一致になる件数を提示する', () => {
    const all = [
      // river は満たすが snow は満たさない施設が2件
      makeSauna({ id: 'a', cooldowns: [coolOf('river')] }),
      makeSauna({ id: 'b', cooldowns: [coolOf('river')] }),
    ];
    const c = conditions({ wish: [RIVER, SNOW] });

    const drop = suggestRelaxations(all, c).find((s) => s.kind === 'drop_wish_tag');
    expect(drop).toBeDefined();
    expect(drop?.droppedTag).toEqual(SNOW);
    expect(drop?.additionalCount).toBe(2);
    expect(drop?.bestMatchRatio).toBe('1/1');
    expect(drop?.label).toContain('を外せば');
  });

  it('結果が0件のときは必ず提案を返す（要件9-5）', () => {
    const all = [
      makeSauna({ id: 'far1', travelMinutes: 200, cooldowns: [coolOf('river')] }),
      makeSauna({ id: 'far2', travelMinutes: 220, cooldowns: [coolOf('river')] }),
    ];
    const c = conditions({ required: { maxTravelMinutes: 60 }, wish: [RIVER] });

    expect(applyRequiredConditions(all, c.required)).toHaveLength(0);

    const suggestions = suggestRelaxations(all, c);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.additionalCount).toBeGreaterThan(0);
  });

  it('完全一致が既にあり結果も十分なら提示しない', () => {
    const all = [1, 2, 3, 4, 5].map((n) =>
      makeSauna({ id: `s${n}`, travelMinutes: 30, cooldowns: [coolOf('river')] }),
    );
    const c = conditions({ required: { maxTravelMinutes: 120 }, wish: [RIVER] });
    expect(suggestRelaxations(all, c)).toEqual([]);
  });

  it('件数の多い順に並ぶ', () => {
    const all = [
      makeSauna({ id: 'near', travelMinutes: 50, priceMin: 3000, cooldowns: [coolOf('river')] }),
      // 移動時間の緩和で3件増える
      ...[1, 2, 3].map((n) =>
        makeSauna({ id: `far${n}`, travelMinutes: 80, priceMin: 3000, cooldowns: [coolOf('river')] }),
      ),
    ];
    const c = conditions({
      required: { maxTravelMinutes: 60, budgetMax: 3500 },
      wish: [RIVER, SNOW],
    });

    const suggestions = suggestRelaxations(all, c);
    for (let i = 1; i < suggestions.length; i += 1) {
      expect(suggestions[i - 1]!.additionalCount).toBeGreaterThanOrEqual(
        suggestions[i]!.additionalCount,
      );
    }
  });

  it('最大2件までに絞る（画面を説明で埋めない）', () => {
    const all = [
      makeSauna({ id: 'near', travelMinutes: 50, priceMin: 3000, cooldowns: [coolOf('river')] }),
      ...[1, 2, 3, 4].map((n) =>
        makeSauna({
          id: `far${n}`,
          travelMinutes: 80,
          priceMin: 6000,
          cooldowns: [coolOf('river')],
          environments: [envOf('forest', 'on_site')],
        }),
      ),
    ];
    const c = conditions({
      required: { maxTravelMinutes: 60, budgetMax: 3500 },
      wish: [RIVER, FOREST, SNOW],
    });
    expect(suggestRelaxations(all, c).length).toBeLessThanOrEqual(2);
  });

  it('移動時間を指定していなければ移動時間の緩和は出さない', () => {
    const all = saunasNearAndFar();
    const c = conditions({ wish: [RIVER, SNOW] });
    const suggestions = suggestRelaxations(all, c);
    expect(suggestions.some((s) => s.kind === 'travel_time')).toBe(false);
  });

  it('希望条件が1件だけなら外す提案は出さない（全部外すことになる）', () => {
    const all = [makeSauna({ id: 'a' })];
    const c = conditions({ wish: [RIVER] });
    const suggestions = suggestRelaxations(all, c);
    expect(suggestions.some((s) => s.kind === 'drop_wish_tag')).toBe(false);
  });

  it('同じ入力に対して常に同じ結果を返す（決定的）', () => {
    const all = saunasNearAndFar();
    const c = conditions({ required: { maxTravelMinutes: 60 }, wish: [RIVER, SNOW] });
    const first = suggestRelaxations(all, c);
    const second = suggestRelaxations([...all].reverse(), c);
    expect(first.map((s) => s.label)).toEqual(second.map((s) => s.label));
  });

  it('緩和しても増えないなら提案に含めない', () => {
    const all = [makeSauna({ id: 'only', travelMinutes: 30, cooldowns: [coolOf('river')] })];
    const c = conditions({ required: { maxTravelMinutes: 60 }, wish: [RIVER] });
    const suggestions = suggestRelaxations(all, c);
    expect(suggestions.every((s) => s.additionalCount > 0)).toBe(true);
  });
});
