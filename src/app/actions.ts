'use server';

import { getRepository } from '@/lib/data';

import type { SaunaSummary, SearchConditions } from '@/lib/types';

/**
 * 端末側が保持している slug から施設概要を解決する。
 *
 * 直近閲覧はゲストの localStorage にあるため、
 * サーバー側で全施設名を先に配らずここで引く。
 */
export async function fetchSummariesBySlugs(slugs: string[]): Promise<SaunaSummary[]> {
  if (slugs.length === 0) return [];
  return getRepository().getSaunaSummariesBySlugs(slugs);
}

/**
 * 現在の条件で見つかる件数（要件2-8）。
 * 条件設定画面で、選ぶたびに手応えを返すために使う。
 */
export async function countMatching(conditions: SearchConditions): Promise<number> {
  return getRepository().countSaunas(conditions);
}
