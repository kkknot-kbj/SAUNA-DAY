'use server';

import { revalidatePath } from 'next/cache';

import { getRepository } from '@/lib/data';

import type { HolidayPlan, SaunaSummary, SearchConditions } from '@/lib/types';

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

// ── Favorites（Phase 3）

/**
 * 「行きたい」に保存する。
 * 認証済みユーザーのみ実行可能。未認証なら何もしない。
 */
export async function addFavorite(saunaId: string): Promise<void> {
  await getRepository().addFavorite(saunaId);
  revalidatePath('/favorites');
}

/**
 * 「行きたい」から解除する。
 * 認証済みユーザーのみ実行可能。未認証なら何もしない。
 */
export async function removeFavorite(saunaId: string): Promise<void> {
  await getRepository().removeFavorite(saunaId);
  revalidatePath('/favorites');
}

/**
 * 現在のユーザーが保存している sauna_id の一覧を返す。
 * 未認証なら空配列。
 */
export async function listFavoriteIds(): Promise<string[]> {
  return getRepository().listFavoriteSaunaIds();
}

// ── Plans（Phase 6）

/**
 * プランを保存する。認証済みユーザーのみ。
 */
export async function savePlan(plan: HolidayPlan): Promise<string> {
  return getRepository().savePlan(plan);
}

/**
 * プランを削除する。認証済みユーザーのみ。
 */
export async function deletePlan(id: string): Promise<void> {
  await getRepository().deletePlan(id);
  revalidatePath('/plans');
}
