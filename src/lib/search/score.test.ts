import { describe, expect, it } from 'vitest';

import { conditions, coolOf, envOf, makeSauna } from './fixtures';
import { rankResults } from './rank';
import { NEUTRAL, buildScoringContext, calculateScore } from './score';
import { DEFAULT_WEIGHTS, WEIGHT_KEYS, normalizeWeights } from './weights';

import type { SaunaDetail, SearchResultItem, TagRef, Weights } from '@/lib/types';

const RIVER_COOLDOWN: TagRef = { category: 'cooldown', key: 'river' };
const FOREST_ENV: TagRef = { category: 'environment', key: 'forest' };
const WOOD_HEAT: TagRef = { category: 'heat_source', key: 'wood' };

function scoreOf(sauna: SaunaDetail, wish: TagRef[] = [], weights: Weights = DEFAULT_WEIGHTS) {
  const c = conditions({ wish });
  const context = buildScoringContext([sauna], c, weights);
  return calculateScore(sauna, c, context);
}

describe('score — スコア計算（要件6）', () => {
  describe('条件一致', () => {
    it('すべて満たせば ratio が 1', () => {
      const sauna = makeSauna({
        id: 'a',
        cooldowns: [coolOf('river')],
        environments: [envOf('forest', 'on_site')],
      });
      const score = scoreOf(sauna, [RIVER_COOLDOWN, FOREST_ENV]);
      expect(score.conditionMatch.ratio).toBe(1);
      expect(score.conditionMatch.matched).toHaveLength(2);
      expect(score.conditionMatch.unmatched).toHaveLength(0);
    });

    it('半分満たせば ratio が 0.5', () => {
      const sauna = makeSauna({ id: 'a', cooldowns: [coolOf('river')] });
      const score = scoreOf(sauna, [RIVER_COOLDOWN, FOREST_ENV]);
      expect(score.conditionMatch.ratio).toBe(0.5);
      expect(score.conditionMatch.matched).toEqual([RIVER_COOLDOWN]);
      expect(score.conditionMatch.unmatched).toEqual([FOREST_ENV]);
    });

    it('希望条件が未指定なら ratio は 1（差をつけない）', () => {
      const score = scoreOf(makeSauna({ id: 'a' }), []);
      expect(score.conditionMatch.ratio).toBe(1);
      expect(score.conditionMatch.matched).toEqual([]);
      expect(score.conditionMatch.unmatched).toEqual([]);
    });

    it('一致・不一致の内訳を返す（「なぜこの順番？」用・要件6-4）', () => {
      const sauna = makeSauna({ id: 'a', features: [WOOD_HEAT] });
      const score = scoreOf(sauna, [WOOD_HEAT, RIVER_COOLDOWN]);
      expect(score.conditionMatch.matched).toEqual([WOOD_HEAT]);
      expect(score.conditionMatch.unmatched).toEqual([RIVER_COOLDOWN]);
    });

    it('「川が近い」だけの施設は「川に入れる」を満たさない（要件4-5）', () => {
      const sauna = makeSauna({ id: 'a', environments: [envOf('river', 'nearby')] });
      const score = scoreOf(sauna, [RIVER_COOLDOWN]);
      expect(score.conditionMatch.ratio).toBe(0);
    });
  });

  describe('距離', () => {
    it('近いほど高い', () => {
      const near = scoreOf(makeSauna({ id: 'a', travelMinutes: 30 }));
      const far = scoreOf(makeSauna({ id: 'b', travelMinutes: 200 }));
      expect(near.distance.normalized).toBeGreaterThan(far.distance.normalized);
    });

    it('不明（null）は中立の 0.5（要件5-9の思想）', () => {
      const score = scoreOf(makeSauna({ id: 'a', travelMinutes: null }));
      expect(score.distance.travelMinutes).toBeNull();
      expect(score.distance.normalized).toBe(NEUTRAL);
    });

    it('基準を超えても 0 未満にならない', () => {
      const c = conditions({ required: { maxTravelMinutes: 60 } });
      const sauna = makeSauna({ id: 'a', travelMinutes: 600 });
      const context = buildScoringContext([sauna], c, DEFAULT_WEIGHTS);
      expect(calculateScore(sauna, c, context).distance.normalized).toBe(0);
    });

    it('移動時間の指定があればそれを基準にする', () => {
      const sauna = makeSauna({ id: 'a', travelMinutes: 60 });
      const c = conditions({ required: { maxTravelMinutes: 120 } });
      const context = buildScoringContext([sauna], c, DEFAULT_WEIGHTS);
      expect(calculateScore(sauna, c, context).distance.normalized).toBeCloseTo(0.5, 10);
    });
  });

  describe('料金', () => {
    it('安いほど高い', () => {
      const saunas = [
        makeSauna({ id: 'cheap', priceMin: 3000 }),
        makeSauna({ id: 'mid', priceMin: 6000 }),
        makeSauna({ id: 'expensive', priceMin: 9000 }),
      ];
      const c = conditions({});
      const context = buildScoringContext(saunas, c, DEFAULT_WEIGHTS);
      const values = saunas.map((s) => calculateScore(s, c, context).price.normalized);
      expect(values[0]).toBe(1);
      expect(values[1]).toBeCloseTo(0.5, 10);
      expect(values[2]).toBe(0);
    });

    it('不明（null）は中立の 0.5', () => {
      const saunas = [
        makeSauna({ id: 'known', priceMin: 3000 }),
        makeSauna({ id: 'unknown', priceMin: null }),
      ];
      const c = conditions({});
      const context = buildScoringContext(saunas, c, DEFAULT_WEIGHTS);
      const score = calculateScore(saunas[1]!, c, context);
      expect(score.price.priceMin).toBeNull();
      expect(score.price.normalized).toBe(NEUTRAL);
    });

    it('全施設が同額なら中立', () => {
      const saunas = [
        makeSauna({ id: 'a', priceMin: 5000 }),
        makeSauna({ id: 'b', priceMin: 5000 }),
      ];
      const c = conditions({});
      const context = buildScoringContext(saunas, c, DEFAULT_WEIGHTS);
      expect(calculateScore(saunas[0]!, c, context).price.normalized).toBe(NEUTRAL);
    });

    it('全施設が料金不明でも壊れない', () => {
      const saunas = [makeSauna({ id: 'a' }), makeSauna({ id: 'b' })];
      const c = conditions({});
      const context = buildScoringContext(saunas, c, DEFAULT_WEIGHTS);
      expect(context.priceRange).toBeNull();
      expect(calculateScore(saunas[0]!, c, context).price.normalized).toBe(NEUTRAL);
    });
  });

  describe('人気', () => {
    it('popularityScore がそのまま使われる', () => {
      const score = scoreOf(makeSauna({ id: 'a', popularityScore: 0.8 }));
      expect(score.popularity.raw).toBe(0.8);
      expect(score.popularity.normalized).toBe(0.8);
    });

    it('範囲外の値は 0..1 に丸める', () => {
      expect(scoreOf(makeSauna({ id: 'a', popularityScore: 1.5 })).popularity.normalized).toBe(1);
      expect(scoreOf(makeSauna({ id: 'b', popularityScore: -1 })).popularity.normalized).toBe(0);
    });
  });

  describe('過去の選択（preference）', () => {
    it('嗜好データがなければ 0', () => {
      const score = scoreOf(makeSauna({ id: 'a', cooldowns: [coolOf('river')] }));
      expect(score.preference.normalized).toBe(0);
      expect(score.preference.matchedTags).toEqual([]);
    });

    it('嗜好タグに一致すると上がる', () => {
      const sauna = makeSauna({ id: 'a', cooldowns: [coolOf('river')] });
      const c = conditions({});
      const preferences = new Map([['cooldown:river', 1]]);
      const context = buildScoringContext([sauna], c, DEFAULT_WEIGHTS, preferences);
      const score = calculateScore(sauna, c, context);
      expect(score.preference.normalized).toBe(1);
      expect(score.preference.matchedTags).toEqual([{ category: 'cooldown', key: 'river' }]);
    });

    it('一部一致なら比率になる', () => {
      const sauna = makeSauna({ id: 'a', cooldowns: [coolOf('river')] });
      const c = conditions({});
      const preferences = new Map([
        ['cooldown:river', 1],
        ['environment:forest', 1],
      ]);
      const context = buildScoringContext([sauna], c, DEFAULT_WEIGHTS, preferences);
      expect(calculateScore(sauna, c, context).preference.normalized).toBeCloseTo(0.5, 10);
    });
  });

  describe('総合値', () => {
    it('内訳の重み付き和と一致する', () => {
      const sauna = makeSauna({
        id: 'a',
        travelMinutes: 60,
        priceMin: 5000,
        popularityScore: 0.7,
        cooldowns: [coolOf('river')],
      });
      const c = conditions({ wish: [RIVER_COOLDOWN, FOREST_ENV] });
      const context = buildScoringContext([sauna], c, DEFAULT_WEIGHTS);
      const s = calculateScore(sauna, c, context);
      const w = normalizeWeights(DEFAULT_WEIGHTS);

      const expected =
        s.conditionMatch.ratio * w.condition_match +
        s.distance.normalized * w.distance +
        s.price.normalized * w.price +
        s.popularity.normalized * w.popularity +
        s.preference.normalized * w.preference;

      expect(s.total).toBeCloseTo(expected, 10);
    });

    it('0..1 の範囲に収まる', () => {
      const best = scoreOf(
        makeSauna({
          id: 'best',
          travelMinutes: 0,
          priceMin: 1000,
          popularityScore: 1,
          cooldowns: [coolOf('river')],
        }),
        [RIVER_COOLDOWN],
      );
      expect(best.total).toBeGreaterThanOrEqual(0);
      expect(best.total).toBeLessThanOrEqual(1);
    });

    it('重みを変えると順位が変わる（ハードコードされていない）', () => {
      const cheapFar = makeSauna({ id: 'cheap-far', priceMin: 2000, travelMinutes: 240 });
      const pricyNear = makeSauna({ id: 'pricy-near', priceMin: 12000, travelMinutes: 20 });
      const saunas = [cheapFar, pricyNear];
      const c = conditions({ required: { maxTravelMinutes: 240 } });

      const priceHeavy: Weights = {
        condition_match: 0,
        distance: 0.1,
        price: 0.9,
        popularity: 0,
        preference: 0,
      };
      const distanceHeavy: Weights = {
        condition_match: 0,
        distance: 0.9,
        price: 0.1,
        popularity: 0,
        preference: 0,
      };

      const rank = (weights: Weights): string[] => {
        const context = buildScoringContext(saunas, c, weights);
        const items: SearchResultItem[] = saunas.map((sauna) => ({
          sauna: {
            id: sauna.id,
            slug: sauna.slug,
            name: sauna.name,
            prefecture: sauna.prefecture,
            area: null,
            heroImage: null,
            primaryTags: [],
            priceMin: sauna.priceMin,
            travelMinutes: sauna.travelMinutes,
            featuredUntil: null,
            featuredCopy: null,
            saunaTempMax: null,
            coolTempMin: null,
          },
          score: calculateScore(sauna, c, context),
        }));
        return rankResults(items).map((item) => item.sauna.id);
      };

      expect(rank(priceHeavy)[0]).toBe('cheap-far');
      expect(rank(distanceHeavy)[0]).toBe('pricy-near');
    });

    it('すべての要素キーが内訳に含まれる', () => {
      const score = scoreOf(makeSauna({ id: 'a' }));
      const keys = ['conditionMatch', 'distance', 'price', 'popularity', 'preference'];
      for (const key of keys) {
        expect(score).toHaveProperty(key);
      }
      expect(WEIGHT_KEYS).toHaveLength(keys.length);
    });
  });
});
