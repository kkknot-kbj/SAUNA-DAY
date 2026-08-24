import type { Origin } from '@/lib/types';

/**
 * 出発地マスタ（関東限定）。
 * 座標は各駅・市の代表点。所要時間の導出にのみ使う。
 */
export const MOCK_ORIGINS: readonly Origin[] = [
  { key: 'tokyo', labelJa: '東京', lat: 35.6812, lng: 139.7671 },
  { key: 'yokohama', labelJa: '横浜', lat: 35.4657, lng: 139.6222 },
  { key: 'omiya', labelJa: '大宮', lat: 35.9065, lng: 139.6238 },
  { key: 'chiba', labelJa: '千葉', lat: 35.6132, lng: 140.1131 },
  { key: 'tachikawa', labelJa: '立川', lat: 35.6979, lng: 139.4139 },
];

export function findOrigin(key: string | null): Origin | null {
  if (key === null) return null;
  return MOCK_ORIGINS.find((origin) => origin.key === key) ?? null;
}
