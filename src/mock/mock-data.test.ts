import { describe, expect, it } from 'vitest';

import { findTerm } from '@/lib/taxonomy/terms';
import { estimateTravelMinutes } from '@/lib/utils/distance';

import { MOCK_ORIGINS } from './origins';
import { MOCK_SAUNAS } from './saunas';

import type { TagRef } from '@/lib/types';

const KANTO = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'];

const tokyo = MOCK_ORIGINS.find((o) => o.key === 'tokyo');

/** 施設が持つ全タグを TagRef の配列にまとめる */
function allTagsOf(sauna: (typeof MOCK_SAUNAS)[number]): TagRef[] {
  return [
    ...sauna.primaryTags,
    ...sauna.features,
    ...sauna.experiences,
    ...sauna.environments.map((e): TagRef => ({ category: 'environment', key: e.key })),
    ...sauna.cooldowns.map((c): TagRef => ({ category: 'cooldown', key: c.key })),
  ];
}

describe('モックデータ（要件20）', () => {
  it('20施設以上ある', () => {
    expect(MOCK_SAUNAS.length).toBeGreaterThanOrEqual(20);
  });

  it('id と slug が一意', () => {
    expect(new Set(MOCK_SAUNAS.map((s) => s.id)).size).toBe(MOCK_SAUNAS.length);
    expect(new Set(MOCK_SAUNAS.map((s) => s.slug)).size).toBe(MOCK_SAUNAS.length);
  });

  it('関東1都6県のみで、全県が登場する', () => {
    const prefectures = MOCK_SAUNAS.map((s) => s.prefecture);
    for (const p of prefectures) {
      expect(KANTO).toContain(p);
    }
    for (const p of KANTO) {
      expect(prefectures).toContain(p);
    }
  });

  it('特定の県に偏っていない（1県あたり最大5施設）', () => {
    const counts = new Map<string, number>();
    for (const s of MOCK_SAUNAS) {
      counts.set(s.prefecture, (counts.get(s.prefecture) ?? 0) + 1);
    }
    for (const count of counts.values()) {
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  it('全タグが語彙に登録されている', () => {
    const unknown: string[] = [];
    for (const sauna of MOCK_SAUNAS) {
      for (const ref of allTagsOf(sauna)) {
        if (findTerm(ref) === null) unknown.push(`${sauna.slug}: ${ref.category}:${ref.key}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it('主要タグは3〜4件（要件7-7）', () => {
    for (const sauna of MOCK_SAUNAS) {
      expect(sauna.primaryTags.length).toBeGreaterThanOrEqual(3);
      expect(sauna.primaryTags.length).toBeLessThanOrEqual(4);
    }
  });

  it('画像の alt が空でない（a11y）', () => {
    for (const sauna of MOCK_SAUNAS) {
      expect(sauna.heroImage?.alt.length ?? 0).toBeGreaterThan(0);
      for (const image of sauna.images) {
        expect(image.alt.length).toBeGreaterThan(0);
      }
    }
  });

  it('事実情報の欠損（null）を含む施設がある（「不明」表示の検証用）', () => {
    expect(MOCK_SAUNAS.some((s) => s.priceMin === null)).toBe(true);
    expect(MOCK_SAUNAS.some((s) => s.businessHours === null)).toBe(true);
    expect(MOCK_SAUNAS.some((s) => s.reservationUrl === null)).toBe(true);
    expect(MOCK_SAUNAS.some((s) => s.parkingNote === null)).toBe(true);
    expect(
      MOCK_SAUNAS.some((s) => s.cooldowns.some((c) => c.waterTempMin === null)),
    ).toBe(true);
    // canDive は null（不明）と false（不可）を区別している
    expect(MOCK_SAUNAS.some((s) => s.cooldowns.some((c) => c.canDive === null))).toBe(true);
    expect(MOCK_SAUNAS.some((s) => s.cooldowns.some((c) => c.canDive === false))).toBe(true);
  });

  it('「川が近い」と「川に入れる」の両方のパターンがある（要件4-5）', () => {
    const enterable = MOCK_SAUNAS.filter((s) => s.cooldowns.some((c) => c.key === 'river'));
    const nearbyOnly = MOCK_SAUNAS.filter(
      (s) =>
        s.environments.some((e) => e.key === 'river') &&
        !s.cooldowns.some((c) => c.key === 'river'),
    );
    expect(enterable.length).toBeGreaterThan(0);
    expect(nearbyOnly.length).toBeGreaterThan(0);
  });

  it('「海が見える」と「海に入れる」の区別がある（要件4-4）', () => {
    const enterable = MOCK_SAUNAS.filter((s) => s.cooldowns.some((c) => c.key === 'sea'));
    expect(enterable.length).toBeGreaterThan(0);
    // 湖でも同様の区別ができている
    const lakeNearbyOnly = MOCK_SAUNAS.filter(
      (s) =>
        s.environments.some((e) => e.key === 'lake') && !s.cooldowns.some((c) => c.key === 'lake'),
    );
    expect(lakeNearbyOnly.length).toBeGreaterThan(0);
  });

  it('サウナタイプ・熱源・クールダウンが分散している', () => {
    const types = new Set(
      MOCK_SAUNAS.flatMap((s) => s.features.filter((f) => f.category === 'sauna_type').map((f) => f.key)),
    );
    const heats = new Set(
      MOCK_SAUNAS.flatMap((s) => s.features.filter((f) => f.category === 'heat_source').map((f) => f.key)),
    );
    const cooldowns = new Set(MOCK_SAUNAS.flatMap((s) => s.cooldowns.map((c) => c.key)));

    expect(types.size).toBe(5);
    expect(heats.size).toBe(3);
    expect(cooldowns.size).toBeGreaterThanOrEqual(7);
  });

  it('料金に幅がある', () => {
    const prices = MOCK_SAUNAS.map((s) => s.priceMin).filter((p): p is number => p !== null);
    expect(Math.min(...prices)).toBeLessThan(3500);
    expect(Math.max(...prices)).toBeGreaterThan(10000);
  });

  it('貸切の有無が分散している', () => {
    const hasFullPrivate = MOCK_SAUNAS.filter((s) =>
      s.features.some((f) => f.category === 'privacy' && f.key === 'full_private'),
    );
    const shared = MOCK_SAUNAS.filter((s) =>
      s.features.some(
        (f) => f.category === 'privacy' && (f.key === 'shared_with_others' || f.key === 'mixed_gender'),
      ),
    );
    expect(hasFullPrivate.length).toBeGreaterThan(0);
    expect(shared.length).toBeGreaterThan(0);
  });

  it('宿泊対応の施設と日帰りのみの施設がある', () => {
    expect(MOCK_SAUNAS.some((s) => s.supportsLodging)).toBe(true);
    expect(MOCK_SAUNAS.some((s) => !s.supportsLodging)).toBe(true);
  });

  it('東京から1時間以内の施設と3時間前後の施設がある（要件20-4）', () => {
    expect(tokyo).toBeDefined();
    if (tokyo === undefined) return;

    const minutes = MOCK_SAUNAS.map((s) => estimateTravelMinutes(tokyo, s)).filter(
      (m): m is number => m !== null,
    );

    expect(Math.min(...minutes)).toBeLessThanOrEqual(60);
    expect(Math.max(...minutes)).toBeGreaterThanOrEqual(140);
  });

  it('全施設の座標が関東の範囲に収まっている', () => {
    for (const sauna of MOCK_SAUNAS) {
      expect(sauna.lat).not.toBeNull();
      expect(sauna.lng).not.toBeNull();
      if (sauna.lat === null || sauna.lng === null) continue;
      expect(sauna.lat).toBeGreaterThan(34.8);
      expect(sauna.lat).toBeLessThan(37.2);
      expect(sauna.lng).toBeGreaterThan(138.4);
      expect(sauna.lng).toBeLessThan(140.9);
    }
  });

  it('実在URLらしきものを使っていない（example.com のみ）', () => {
    for (const sauna of MOCK_SAUNAS) {
      for (const url of [sauna.reservationUrl, sauna.officialUrl]) {
        if (url === null) continue;
        expect(url).toContain('example.com');
      }
    }
  });
});

describe('出発地マスタ', () => {
  it('関東の主要地点が5件ある', () => {
    expect(MOCK_ORIGINS.length).toBe(5);
    expect(new Set(MOCK_ORIGINS.map((o) => o.key)).size).toBe(5);
  });
});
