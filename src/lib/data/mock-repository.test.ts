import { describe, expect, it } from 'vitest';

import { EMPTY_CONDITIONS } from '@/lib/types';

import { getRepository } from './index';

import type { SearchConditions, TagRef } from '@/lib/types';

const repo = getRepository();

function build(overrides: {
  required?: Partial<SearchConditions['required']>;
  wish?: TagRef[];
}): SearchConditions {
  return {
    required: { ...EMPTY_CONDITIONS.required, ...overrides.required },
    wish: { tags: overrides.wish ?? [] },
  };
}

describe('mockRepository — 実データでの検索（要件5・6・7・9）', () => {
  it('条件なしなら全施設が返る', async () => {
    const outcome = await repo.searchSaunas(build({}));
    expect(outcome.items.length).toBe(outcome.totalBeforeFilter);
    expect(outcome.items.length).toBeGreaterThanOrEqual(20);
  });

  it('出発地を指定すると所要時間が入る', async () => {
    const outcome = await repo.searchSaunas(build({ required: { originKey: 'tokyo' } }));
    expect(outcome.items.every((i) => i.sauna.travelMinutes !== null)).toBe(true);
  });

  it('出発地を指定しなければ所要時間は不明（null）', async () => {
    const outcome = await repo.searchSaunas(build({}));
    expect(outcome.items.every((i) => i.sauna.travelMinutes === null)).toBe(true);
  });

  it('移動時間で絞ると件数が減る', async () => {
    const all = await repo.searchSaunas(build({ required: { originKey: 'tokyo' } }));
    const near = await repo.searchSaunas(
      build({ required: { originKey: 'tokyo', maxTravelMinutes: 90 } }),
    );
    expect(near.items.length).toBeLessThan(all.items.length);
    expect(near.items.length).toBeGreaterThan(0);
    expect(near.items.every((i) => (i.sauna.travelMinutes ?? 0) <= 90)).toBe(true);
  });

  it('予算で絞ると高額な施設が落ちる', async () => {
    const outcome = await repo.searchSaunas(build({ required: { budgetMax: 4000 } }));
    expect(outcome.items.length).toBeGreaterThan(0);
    // 料金不明の施設は落とさない（要件5-9）ので null を許容する
    expect(outcome.items.every((i) => i.sauna.priceMin === null || i.sauna.priceMin <= 4000)).toBe(
      true,
    );
  });

  it('IMPORTANT: 「川に入れる」で絞ると川が近いだけの施設が入らない（要件4-5）', async () => {
    const outcome = await repo.searchSaunas(
      build({ required: { absoluteTags: [{ category: 'cooldown', key: 'river' }] } }),
    );
    expect(outcome.items.length).toBeGreaterThan(0);

    for (const item of outcome.items) {
      const detail = await repo.getSaunaBySlug(item.sauna.slug);
      expect(detail?.cooldowns.some((c) => c.key === 'river'), item.sauna.slug).toBe(true);
    }

    // 「川が近いだけ」の施設が除外されていることを具体的に確認
    const slugs = outcome.items.map((i) => i.sauna.slug);
    expect(slugs).not.toContain('hanno-shinrin-hut'); // 川は徒歩圏だが入水不可
    expect(slugs).not.toContain('yoro-keikoku-hanare'); // 川は見えるだけ
  });

  it('「川が近い」で絞ると入水できない施設も含まれる', async () => {
    const outcome = await repo.searchSaunas(
      build({ required: { absoluteTags: [{ category: 'environment', key: 'river' }] } }),
    );
    const slugs = outcome.items.map((i) => i.sauna.slug);
    expect(slugs).toContain('hanno-shinrin-hut');
  });

  it('希望条件を指定すると一致率が計算される', async () => {
    const wish: TagRef[] = [
      { category: 'cooldown', key: 'river' },
      { category: 'heat_source', key: 'wood' },
    ];
    const outcome = await repo.searchSaunas(build({ wish }));
    const top = outcome.items[0];
    expect(top).toBeDefined();
    expect(top?.score.conditionMatch.ratio).toBe(1);
    expect(top?.score.conditionMatch.matched).toHaveLength(2);
  });

  it('希望条件を満たす施設が上位に来る', async () => {
    const wish: TagRef[] = [{ category: 'experience', key: 'snow_dive' }];
    const outcome = await repo.searchSaunas(build({ wish }));
    const topThree = outcome.items.slice(0, 3);
    expect(topThree.some((i) => i.score.conditionMatch.ratio === 1)).toBe(true);
  });

  it('条件を変えると並び順が変わる（要件20-6）', async () => {
    const byRiver = await repo.searchSaunas(
      build({ wish: [{ category: 'cooldown', key: 'river' }] }),
    );
    const bySea = await repo.searchSaunas(build({ wish: [{ category: 'cooldown', key: 'sea' }] }));
    expect(byRiver.items[0]?.sauna.slug).not.toBe(bySea.items[0]?.sauna.slug);
  });

  it('同じ条件なら常に同じ順序（決定的・要件6-5）', async () => {
    const c = build({ required: { originKey: 'tokyo' }, wish: [{ category: 'environment', key: 'forest' }] });
    const first = await repo.searchSaunas(c);
    const second = await repo.searchSaunas(c);
    expect(first.items.map((i) => i.sauna.slug)).toEqual(second.items.map((i) => i.sauna.slug));
  });

  it('スコアの内訳がすべて揃っている（要件8-2）', async () => {
    const outcome = await repo.searchSaunas(build({ required: { originKey: 'tokyo' } }));
    const score = outcome.items[0]?.score;
    expect(score?.conditionMatch).toBeDefined();
    expect(score?.distance).toBeDefined();
    expect(score?.price).toBeDefined();
    expect(score?.popularity).toBeDefined();
    expect(score?.preference).toBeDefined();
    expect(score?.total).toBeGreaterThan(0);
  });

  it('ゲストなので preference は結果に影響しない', async () => {
    const outcome = await repo.searchSaunas(build({}));
    expect(outcome.items.every((i) => i.score.preference.normalized === 0)).toBe(true);
  });

  it('結果が0件になる条件では緩和提示が返る（要件9-5）', async () => {
    const outcome = await repo.searchSaunas(
      build({ required: { originKey: 'tokyo', maxTravelMinutes: 20 } }),
    );
    expect(outcome.items).toHaveLength(0);
    expect(outcome.suggestions.length).toBeGreaterThan(0);
    expect(outcome.suggestions[0]?.additionalCount).toBeGreaterThan(0);
  });

  it('countSaunas が検索結果の件数と一致する', async () => {
    const c = build({ required: { originKey: 'tokyo', maxTravelMinutes: 120 } });
    const outcome = await repo.searchSaunas(c);
    expect(await repo.countSaunas(c)).toBe(outcome.items.length);
  });

  describe('個別取得', () => {
    it('slug で詳細が取れる', async () => {
      const detail = await repo.getSaunaBySlug('okutama-kawabe-sauna');
      expect(detail?.name).toBe('奥多摩 川辺サウナ');
      expect(detail?.cooldowns.length).toBeGreaterThan(0);
    });

    it('存在しない slug は null', async () => {
      expect(await repo.getSaunaBySlug('does-not-exist')).toBeNull();
    });

    it('id 配列の順序を保って概要を返す', async () => {
      const summaries = await repo.getSaunaSummariesByIds(['s05', 's01', 's03']);
      expect(summaries.map((s) => s.id)).toEqual(['s05', 's01', 's03']);
    });

    it('存在しない id は黙って除外する', async () => {
      const summaries = await repo.getSaunaSummariesByIds(['s01', 'nope']);
      expect(summaries.map((s) => s.id)).toEqual(['s01']);
    });
  });

  describe('周辺施設', () => {
    it('紐付いた候補が取れる', async () => {
      const linked = await repo.getLinkedPlaces('s01');
      expect(linked.restaurants.length).toBeGreaterThan(0);
      expect(linked.spots.length).toBeGreaterThan(0);
    });

    it('未登録のサウナでは空を返す', async () => {
      const linked = await repo.getLinkedPlaces('unknown');
      expect(linked.restaurants).toEqual([]);
      expect(linked.spots).toEqual([]);
      expect(linked.hotels).toEqual([]);
    });
  });

  describe('マスタ', () => {
    it('出発地が取れる', async () => {
      const origins = await repo.listOrigins();
      expect(origins.map((o) => o.key)).toContain('tokyo');
    });

    it('重みの合計が 1.0', async () => {
      const weights = await repo.getWeights();
      const sum =
        weights.condition_match +
        weights.distance +
        weights.price +
        weights.popularity +
        weights.preference;
      expect(sum).toBeCloseTo(1, 10);
    });
  });
});
