import type { SearchResultItem } from '@/lib/types';

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
    return a.sauna.slug.localeCompare(b.sauna.slug, 'en');
  });
}
