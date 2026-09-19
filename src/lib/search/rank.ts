import type { SearchResultItem } from '@/lib/types';

/** 並び替えの種類 */
export type SortKey =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'sauna_temp'
  | 'cool_temp';

/** UI 表示用のラベル */
export const SORT_LABELS: Record<SortKey, string> = {
  recommended: 'おすすめ順',
  price_asc: '安い順',
  price_desc: '高い順',
  sauna_temp: 'サウナが熱い順',
  cool_temp: '水風呂が冷たい順',
};

/** 有効なソートキーか判定 */
export function isSortKey(value: string): value is SortKey {
  return value in SORT_LABELS;
}

/** slug 昇順で決定的に決着させる第2キー */
function bySlug(a: SearchResultItem, b: SearchResultItem): number {
  return a.sauna.slug.localeCompare(b.sauna.slug, 'en');
}

/**
 * スコア降順に並べる。
 *
 * IMPORTANT: 同スコアのときは slug 昇順で決着させる（要件6-5）。
 * Array.prototype.sort は同値の順序を保証するが、
 * 入力順が変われば結果も変わるため、明示的な第2キーで決定的にする。
 */
export function rankResults(items: readonly SearchResultItem[]): SearchResultItem[] {
  return [...items].sort((a, b) => {
    const diff = b.score.total - a.score.total;
    // 浮動小数の誤差で順序が揺れないよう、十分小さい差は同値として扱う
    if (Math.abs(diff) > 1e-9) return diff;
    return bySlug(a, b);
  });
}

/**
 * 指定のソートキーで並べ替える。
 *
 * recommended はスコア順（rankResults）。それ以外は各指標で並べる。
 * IMPORTANT: 値が null（不明）の施設は必ず末尾に置く。推測で順位を作らない。
 * 同値は slug 昇順で決定的にする。
 */
export function sortResults(
  items: readonly SearchResultItem[],
  key: SortKey,
): SearchResultItem[] {
  if (key === 'recommended') return rankResults(items);

  /** null を末尾に送る比較。asc=true で昇順 */
  const compareNullable = (
    a: number | null,
    b: number | null,
    asc: boolean,
  ): number => {
    if (a === null && b === null) return 0;
    if (a === null) return 1; // null は後ろ
    if (b === null) return -1;
    return asc ? a - b : b - a;
  };

  return [...items].sort((a, b) => {
    let diff = 0;
    switch (key) {
      case 'price_asc':
        diff = compareNullable(a.sauna.priceMin, b.sauna.priceMin, true);
        break;
      case 'price_desc':
        diff = compareNullable(a.sauna.priceMin, b.sauna.priceMin, false);
        break;
      case 'sauna_temp':
        // サウナが熱い順（高い順）
        diff = compareNullable(a.sauna.saunaTempMax, b.sauna.saunaTempMax, false);
        break;
      case 'cool_temp':
        // 水風呂が冷たい順（低い順）
        diff = compareNullable(a.sauna.coolTempMin, b.sauna.coolTempMin, true);
        break;
    }
    if (diff !== 0) return diff;
    return bySlug(a, b);
  });
}
