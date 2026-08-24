import { EMPTY_CONDITIONS } from '@/lib/types';
import { findTerm } from '@/lib/taxonomy/terms';

import type { CompanionType, SearchConditions, StayType, TagRef } from '@/lib/types';

/**
 * 検索条件と URL クエリの相互変換。
 *
 * 条件を URL に反映することで、リロードや共有で失われないようにする（要件2-9）。
 * Server Component 側で条件を復元するためにも使う。
 */

const KEYS = {
  date: 'date',
  party: 'party',
  companion: 'with',
  origin: 'from',
  travel: 'travel',
  stay: 'stay',
  budget: 'budget',
  absolute: 'must',
  wish: 'wish',
} as const;

const STAY_TYPES: readonly StayType[] = ['day_trip', 'lodging'];
const COMPANIONS: readonly CompanionType[] = ['solo', 'couple', 'friends', 'family'];

/** "category:key" の配列を TagRef に戻す。語彙に無い値は捨てる */
function parseTags(value: string | null): TagRef[] {
  if (value === null || value === '') return [];

  return value
    .split(',')
    .flatMap((part): TagRef[] => {
      const [category, key] = part.split(':');
      if (category === undefined || key === undefined) return [];
      const ref = { category, key } as TagRef;
      // 語彙に登録されていないタグは無視する（不正なURLで壊れないように）
      return findTerm(ref) === null ? [] : [ref];
    });
}

function serializeTags(tags: TagRef[]): string {
  return tags.map((ref) => `${ref.category}:${ref.key}`).join(',');
}

function parseInteger(value: string | null): number | null {
  if (value === null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseDate(value: string | null): string | null {
  if (value === null) return null;
  // YYYY-MM-DD のみ受け付ける
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(new Date(`${value}T00:00:00`).getTime()) ? null : value;
}

type QueryInput = Record<string, string | string[] | undefined>;

function pick(query: QueryInput, key: string): string | null {
  const value = query[key];
  if (value === undefined) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** URL クエリから検索条件を復元する。不正な値は「指定なし」に落とす */
export function conditionsFromQuery(query: QueryInput): SearchConditions {
  const stay = pick(query, KEYS.stay);
  const companion = pick(query, KEYS.companion);

  return {
    required: {
      date: parseDate(pick(query, KEYS.date)),
      partySize: parseInteger(pick(query, KEYS.party)),
      companion: COMPANIONS.includes(companion as CompanionType)
        ? (companion as CompanionType)
        : null,
      originKey: pick(query, KEYS.origin),
      maxTravelMinutes: parseInteger(pick(query, KEYS.travel)),
      stayType: STAY_TYPES.includes(stay as StayType) ? (stay as StayType) : null,
      budgetMax: parseInteger(pick(query, KEYS.budget)),
      absoluteTags: parseTags(pick(query, KEYS.absolute)),
    },
    wish: { tags: parseTags(pick(query, KEYS.wish)) },
  };
}

/** 検索条件を URLSearchParams にする。未指定の項目はキーを出さない */
export function conditionsToQuery(conditions: SearchConditions): URLSearchParams {
  const params = new URLSearchParams();
  const { required, wish } = conditions;

  if (required.date !== null) params.set(KEYS.date, required.date);
  if (required.partySize !== null) params.set(KEYS.party, String(required.partySize));
  if (required.companion !== null) params.set(KEYS.companion, required.companion);
  if (required.originKey !== null) params.set(KEYS.origin, required.originKey);
  if (required.maxTravelMinutes !== null) {
    params.set(KEYS.travel, String(required.maxTravelMinutes));
  }
  if (required.stayType !== null) params.set(KEYS.stay, required.stayType);
  if (required.budgetMax !== null) params.set(KEYS.budget, String(required.budgetMax));
  if (required.absoluteTags.length > 0) {
    params.set(KEYS.absolute, serializeTags(required.absoluteTags));
  }
  if (wish.tags.length > 0) params.set(KEYS.wish, serializeTags(wish.tags));

  return params;
}

/** 条件を反映したパスを組み立てる */
export function pathWithConditions(path: string, conditions: SearchConditions): string {
  const query = conditionsToQuery(conditions).toString();
  return query === '' ? path : `${path}?${query}`;
}

/** 何も指定されていないか */
export function isEmptyConditions(conditions: SearchConditions): boolean {
  return conditionsToQuery(conditions).toString() === '';
}

export { EMPTY_CONDITIONS };
