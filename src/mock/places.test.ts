import { describe, expect, it } from 'vitest';

import { linkedPlacesOf, MOCK_HOTELS, MOCK_RESTAURANTS, MOCK_SPOTS } from './places';
import { MOCK_SAUNAS } from './saunas';

describe('周辺施設のモックデータ（要件11・20-9）', () => {
  it('id が一意', () => {
    expect(new Set(MOCK_RESTAURANTS.map((r) => r.id)).size).toBe(MOCK_RESTAURANTS.length);
    expect(new Set(MOCK_SPOTS.map((s) => s.id)).size).toBe(MOCK_SPOTS.length);
    expect(new Set(MOCK_HOTELS.map((h) => h.id)).size).toBe(MOCK_HOTELS.length);
  });

  it('全サウナにサ飯の候補が1件以上ある', () => {
    for (const sauna of MOCK_SAUNAS) {
      const linked = linkedPlacesOf(sauna.id);
      expect(linked.restaurants.length, sauna.slug).toBeGreaterThan(0);
    }
  });

  it('全サウナに観光・アクティビティ・温泉のいずれかの候補がある', () => {
    for (const sauna of MOCK_SAUNAS) {
      const linked = linkedPlacesOf(sauna.id);
      expect(linked.spots.length, sauna.slug).toBeGreaterThan(0);
    }
  });

  it('宿泊候補を持つサウナと持たないサウナの両方がある', () => {
    const withHotels = MOCK_SAUNAS.filter((s) => linkedPlacesOf(s.id).hotels.length > 0);
    const withoutHotels = MOCK_SAUNAS.filter((s) => linkedPlacesOf(s.id).hotels.length === 0);
    expect(withHotels.length).toBeGreaterThan(0);
    expect(withoutHotels.length).toBeGreaterThan(0);
  });

  // 注: 「サウナ付き一棟貸し」への転換により、施設自体が宿泊先となった。
  // 宿泊対応の施設が別の宿泊候補(hotels)を持つ必要はなくなったため、
  // 旧モデルの「宿泊対応サウナには宿泊候補が必須」テストは削除した。

  it('温泉カテゴリのスポットが存在する（プランに温泉を含められる）', () => {
    expect(MOCK_SPOTS.some((s) => s.category === 'onsen')).toBe(true);
    expect(MOCK_SPOTS.some((s) => s.category === 'activity')).toBe(true);
    expect(MOCK_SPOTS.some((s) => s.category === 'sightseeing')).toBe(true);
  });

  it('紐付けの参照が壊れていない（存在しないIDを指していない）', () => {
    for (const sauna of MOCK_SAUNAS) {
      const linked = linkedPlacesOf(sauna.id);
      for (const l of linked.restaurants) {
        expect(MOCK_RESTAURANTS.map((r) => r.id)).toContain(l.restaurant.id);
      }
      for (const l of linked.spots) {
        expect(MOCK_SPOTS.map((s) => s.id)).toContain(l.spot.id);
      }
      for (const l of linked.hotels) {
        expect(MOCK_HOTELS.map((h) => h.id)).toContain(l.hotel.id);
      }
    }
  });

  it('おすすめ度が 0..1 に収まっている', () => {
    for (const sauna of MOCK_SAUNAS) {
      const linked = linkedPlacesOf(sauna.id);
      for (const l of [...linked.restaurants, ...linked.spots, ...linked.hotels]) {
        expect(l.recommendScore).toBeGreaterThanOrEqual(0);
        expect(l.recommendScore).toBeLessThanOrEqual(1);
      }
    }
  });

  it('営業時間が不明な店がある（「不明」表示の検証用）', () => {
    expect(MOCK_RESTAURANTS.some((r) => r.businessHours === null)).toBe(true);
    expect(MOCK_SPOTS.some((s) => s.businessHours === null)).toBe(true);
  });

  it('予約URLが不明な宿がある（遷移手段を出さない検証用）', () => {
    expect(MOCK_HOTELS.some((h) => h.reservationUrl === null)).toBe(true);
    expect(MOCK_HOTELS.some((h) => h.reservationUrl !== null)).toBe(true);
  });

  it('実在URLらしきものを使っていない', () => {
    const urls = [
      ...MOCK_RESTAURANTS.map((r) => r.officialUrl),
      ...MOCK_SPOTS.map((s) => s.officialUrl),
      ...MOCK_HOTELS.flatMap((h) => [h.officialUrl, h.reservationUrl]),
    ].filter((u): u is string => u !== null);

    for (const url of urls) {
      expect(url).toContain('example.com');
    }
  });
});
