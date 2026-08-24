import { describe, expect, it } from 'vitest';

import { conditions, coolOf, envOf, makeSauna } from './fixtures';
import { applyRequiredConditions, findExclusionReason } from './filter';

describe('filter — 必須条件による除外（要件5）', () => {
  describe('移動時間', () => {
    it('上限を超える施設を除外する', () => {
      const sauna = makeSauna({ id: 'a', travelMinutes: 200 });
      const c = conditions({ required: { maxTravelMinutes: 120 } });
      expect(findExclusionReason(sauna, c.required)).toBe('travel_time');
    });

    it('上限内なら残す', () => {
      const sauna = makeSauna({ id: 'a', travelMinutes: 100 });
      const c = conditions({ required: { maxTravelMinutes: 120 } });
      expect(findExclusionReason(sauna, c.required)).toBeNull();
    });

    it('境界値（ちょうど上限）は残す', () => {
      const sauna = makeSauna({ id: 'a', travelMinutes: 120 });
      const c = conditions({ required: { maxTravelMinutes: 120 } });
      expect(findExclusionReason(sauna, c.required)).toBeNull();
    });

    it('所要時間が不明（null）なら除外しない（要件5-9）', () => {
      const sauna = makeSauna({ id: 'a', travelMinutes: null });
      const c = conditions({ required: { maxTravelMinutes: 60 } });
      expect(findExclusionReason(sauna, c.required)).toBeNull();
    });

    it('条件が未指定なら除外しない', () => {
      const sauna = makeSauna({ id: 'a', travelMinutes: 999 });
      expect(findExclusionReason(sauna, conditions({}).required)).toBeNull();
    });
  });

  describe('予算', () => {
    it('最低料金が上限を超える施設を除外する', () => {
      const sauna = makeSauna({ id: 'a', priceMin: 9000 });
      const c = conditions({ required: { budgetMax: 5000 } });
      expect(findExclusionReason(sauna, c.required)).toBe('budget');
    });

    it('料金が不明（null）なら除外しない（要件5-9）', () => {
      const sauna = makeSauna({ id: 'a', priceMin: null });
      const c = conditions({ required: { budgetMax: 3000 } });
      expect(findExclusionReason(sauna, c.required)).toBeNull();
    });
  });

  describe('人数', () => {
    it('最小人数に届かない施設を除外する', () => {
      const sauna = makeSauna({ id: 'a', capacityMin: 4, capacityMax: 10 });
      const c = conditions({ required: { partySize: 2 } });
      expect(findExclusionReason(sauna, c.required)).toBe('party_size');
    });

    it('最大人数を超える施設を除外する', () => {
      const sauna = makeSauna({ id: 'a', capacityMin: 1, capacityMax: 4 });
      const c = conditions({ required: { partySize: 8 } });
      expect(findExclusionReason(sauna, c.required)).toBe('party_size');
    });

    it('範囲内なら残す', () => {
      const sauna = makeSauna({ id: 'a', capacityMin: 1, capacityMax: 8 });
      const c = conditions({ required: { partySize: 4 } });
      expect(findExclusionReason(sauna, c.required)).toBeNull();
    });

    it('受け入れ人数が不明（null）なら除外しない（要件5-9）', () => {
      const sauna = makeSauna({ id: 'a', capacityMin: null, capacityMax: null });
      const c = conditions({ required: { partySize: 20 } });
      expect(findExclusionReason(sauna, c.required)).toBeNull();
    });

    it('片側だけ不明なら分かる側だけで判定する', () => {
      const sauna = makeSauna({ id: 'a', capacityMin: null, capacityMax: 4 });
      expect(findExclusionReason(sauna, conditions({ required: { partySize: 8 } }).required)).toBe(
        'party_size',
      );
      expect(
        findExclusionReason(sauna, conditions({ required: { partySize: 2 } }).required),
      ).toBeNull();
    });
  });

  describe('日帰り / 宿泊', () => {
    it('宿泊指定で宿泊非対応の施設を除外する', () => {
      const sauna = makeSauna({ id: 'a', supportsLodging: false });
      const c = conditions({ required: { stayType: 'lodging' } });
      expect(findExclusionReason(sauna, c.required)).toBe('stay_type');
    });

    it('日帰り指定で日帰り非対応の施設を除外する', () => {
      const sauna = makeSauna({ id: 'a', supportsDayTrip: false });
      const c = conditions({ required: { stayType: 'day_trip' } });
      expect(findExclusionReason(sauna, c.required)).toBe('stay_type');
    });

    it('宿泊対応なら宿泊指定でも残す', () => {
      const sauna = makeSauna({ id: 'a', supportsLodging: true });
      const c = conditions({ required: { stayType: 'lodging' } });
      expect(findExclusionReason(sauna, c.required)).toBeNull();
    });
  });

  describe('絶対条件', () => {
    it('指定タグを持たない施設を除外する', () => {
      const sauna = makeSauna({ id: 'a', features: [{ category: 'privacy', key: 'mixed_gender' }] });
      const c = conditions({
        required: { absoluteTags: [{ category: 'privacy', key: 'full_private' }] },
      });
      expect(findExclusionReason(sauna, c.required)).toBe('absolute_tag');
    });

    it('指定タグを持つ施設は残す', () => {
      const sauna = makeSauna({ id: 'a', features: [{ category: 'privacy', key: 'full_private' }] });
      const c = conditions({
        required: { absoluteTags: [{ category: 'privacy', key: 'full_private' }] },
      });
      expect(findExclusionReason(sauna, c.required)).toBeNull();
    });

    it('複数指定のうち1つでも欠けたら除外する', () => {
      const sauna = makeSauna({ id: 'a', features: [{ category: 'privacy', key: 'full_private' }] });
      const c = conditions({
        required: {
          absoluteTags: [
            { category: 'privacy', key: 'full_private' },
            { category: 'usage', key: 'pets_ok' },
          ],
        },
      });
      expect(findExclusionReason(sauna, c.required)).toBe('absolute_tag');
    });
  });

  describe('IMPORTANT: 「近くにある」と「入れる」の区別（要件4-5）', () => {
    const enterable = makeSauna({
      id: 'enterable',
      environments: [envOf('river', 'on_site')],
      cooldowns: [coolOf('river', { canDive: true })],
    });

    const nearbyOnly = makeSauna({
      id: 'nearby',
      environments: [envOf('river', 'nearby')],
      cooldowns: [coolOf('cold_bath')],
    });

    it('「川に入れる」を絶対条件にすると、川が近いだけの施設は除外される', () => {
      const c = conditions({
        required: { absoluteTags: [{ category: 'cooldown', key: 'river' }] },
      });
      const result = applyRequiredConditions([enterable, nearbyOnly], c.required);
      expect(result.map((s) => s.id)).toEqual(['enterable']);
    });

    it('「川が近い」を絶対条件にすると、両方が残る', () => {
      const c = conditions({
        required: { absoluteTags: [{ category: 'environment', key: 'river' }] },
      });
      const result = applyRequiredConditions([enterable, nearbyOnly], c.required);
      expect(result.map((s) => s.id).sort()).toEqual(['enterable', 'nearby']);
    });
  });

  it('applyRequiredConditions は複合条件をすべて適用する', () => {
    const saunas = [
      makeSauna({ id: 'ok', travelMinutes: 60, priceMin: 4000, capacityMax: 6 }),
      makeSauna({ id: 'far', travelMinutes: 300, priceMin: 4000, capacityMax: 6 }),
      makeSauna({ id: 'pricey', travelMinutes: 60, priceMin: 20000, capacityMax: 6 }),
      makeSauna({ id: 'small', travelMinutes: 60, priceMin: 4000, capacityMax: 2 }),
    ];
    const c = conditions({
      required: { maxTravelMinutes: 120, budgetMax: 8000, partySize: 4 },
    });
    expect(applyRequiredConditions(saunas, c.required).map((s) => s.id)).toEqual(['ok']);
  });
});
