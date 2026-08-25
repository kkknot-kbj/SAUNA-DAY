import { describe, expect, it } from 'vitest';

import { EMPTY_CONDITIONS } from '@/lib/types';

import {
  conditionsFromQuery,
  conditionsToQuery,
  isEmptyConditions,
  pathWithConditions,
} from './conditions-url';

import type { SearchConditions } from '@/lib/types';

const FULL: SearchConditions = {
  required: {
    date: '2026-09-05',
    partySize: 4,
    companion: 'friends',
    originKey: 'tokyo',
    maxTravelMinutes: 120,
    stayType: 'day_trip',
    budgetMax: 8000,
    absoluteTags: [{ category: 'privacy', key: 'full_private' }],
    areaKeys: [],
    excludeVisited: false,
  },
  wish: {
    tags: [
      { category: 'cooldown', key: 'river' },
      { category: 'heat_source', key: 'wood' },
    ],
  },
};

describe('conditions-url — 条件とURLの相互変換（要件2-9）', () => {
  it('往復して同じ条件に戻る', () => {
    const query = conditionsToQuery(FULL);
    const restored = conditionsFromQuery(Object.fromEntries(query.entries()));
    expect(restored).toEqual(FULL);
  });

  it('未指定の項目はクエリに出さない', () => {
    expect(conditionsToQuery(EMPTY_CONDITIONS).toString()).toBe('');
  });

  it('空のクエリからは空の条件になる', () => {
    expect(conditionsFromQuery({})).toEqual(EMPTY_CONDITIONS);
  });

  it('pathWithConditions は条件がなければクエリを付けない', () => {
    expect(pathWithConditions('/search/results', EMPTY_CONDITIONS)).toBe('/search/results');
  });

  it('pathWithConditions は条件をクエリにする', () => {
    const path = pathWithConditions('/search/results', FULL);
    expect(path.startsWith('/search/results?')).toBe(true);
    expect(path).toContain('from=tokyo');
  });

  it('isEmptyConditions が判定できる', () => {
    expect(isEmptyConditions(EMPTY_CONDITIONS)).toBe(true);
    expect(isEmptyConditions(FULL)).toBe(false);
  });

  describe('不正な値で壊れない', () => {
    it('語彙に無いタグは捨てる', () => {
      const restored = conditionsFromQuery({ wish: 'cooldown:river,bogus:nope,cooldown:unknown' });
      expect(restored.wish.tags).toEqual([{ category: 'cooldown', key: 'river' }]);
    });

    it('壊れたタグ表記を捨てる', () => {
      expect(conditionsFromQuery({ wish: 'no-colon,,:,' }).wish.tags).toEqual([]);
    });

    it('数値でない値は null になる', () => {
      const restored = conditionsFromQuery({ travel: 'abc', budget: '', party: '-3' });
      expect(restored.required.maxTravelMinutes).toBeNull();
      expect(restored.required.budgetMax).toBeNull();
      expect(restored.required.partySize).toBeNull();
    });

    it('不正な日付は null になる', () => {
      expect(conditionsFromQuery({ date: '2026-13-45' }).required.date).toBeNull();
      expect(conditionsFromQuery({ date: 'today' }).required.date).toBeNull();
      expect(conditionsFromQuery({ date: '2026-9-5' }).required.date).toBeNull();
    });

    it('正しい日付は通る', () => {
      expect(conditionsFromQuery({ date: '2026-09-05' }).required.date).toBe('2026-09-05');
    });

    it('定義外の stay / with は null になる', () => {
      expect(conditionsFromQuery({ stay: 'forever' }).required.stayType).toBeNull();
      expect(conditionsFromQuery({ with: 'dog' }).required.companion).toBeNull();
    });

    it('配列で渡された場合は先頭を使う', () => {
      expect(conditionsFromQuery({ from: ['tokyo', 'osaka'] }).required.originKey).toBe('tokyo');
    });
  });

  it('IMPORTANT: environment と cooldown が別タグとして往復する（要件4）', () => {
    const conditions: SearchConditions = {
      required: { ...EMPTY_CONDITIONS.required },
      wish: {
        tags: [
          { category: 'environment', key: 'river' },
          { category: 'cooldown', key: 'river' },
        ],
      },
    };
    const query = conditionsToQuery(conditions);
    const restored = conditionsFromQuery(Object.fromEntries(query.entries()));
    expect(restored.wish.tags).toHaveLength(2);
    expect(restored.wish.tags).toEqual(conditions.wish.tags);
  });
});
