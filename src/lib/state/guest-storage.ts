import { EMPTY_CONDITIONS } from '@/lib/types';

import type { SearchConditions } from '@/lib/types';

/**
 * 未認証（ゲスト）状態で端末側に保持する情報。
 *
 * 会員登録を求めずに検索・閲覧できるようにするため、
 * 条件と直近閲覧はここに置く（要件2-9 / 1-2）。
 * 認証後にユーザーアカウントへ移行する（要件15-5）。
 */
export type GuestState = {
  conditions: SearchConditions | null;
  /** 直近閲覧した施設の slug。新しいものが先頭 */
  recentlyViewed: string[];
  /** 認証後に完了させる「行きたい」保存対象の slug（要件13-3） */
  pendingFavorite: string | null;
};

const STORAGE_KEY = 'sauna-day.guest';
const RECENT_LIMIT = 10;

export const EMPTY_GUEST_STATE: GuestState = {
  conditions: null,
  recentlyViewed: [],
  pendingFavorite: null,
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** 保存された値の形が変わっていても壊れないように検証する */
function parse(raw: string): GuestState {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_GUEST_STATE;

    const record = parsed as Record<string, unknown>;
    const recentlyViewed = Array.isArray(record.recentlyViewed)
      ? record.recentlyViewed.filter((value): value is string => typeof value === 'string')
      : [];

    return {
      conditions: isConditions(record.conditions) ? record.conditions : null,
      recentlyViewed: recentlyViewed.slice(0, RECENT_LIMIT),
      pendingFavorite:
        typeof record.pendingFavorite === 'string' ? record.pendingFavorite : null,
    };
  } catch {
    return EMPTY_GUEST_STATE;
  }
}

function isConditions(value: unknown): value is SearchConditions {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.required === 'object' && typeof record.wish === 'object';
}

export function loadGuestState(): GuestState {
  if (!isBrowser()) return EMPTY_GUEST_STATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return EMPTY_GUEST_STATE;
  return parse(raw);
}

function save(state: GuestState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 容量超過やプライベートモードでも画面を壊さない
  }
}

export function saveConditions(conditions: SearchConditions): void {
  save({ ...loadGuestState(), conditions });
}

/** 直近閲覧に追加する。重複は先頭へ寄せる */
export function pushRecentlyViewed(slug: string): void {
  const state = loadGuestState();
  const next = [slug, ...state.recentlyViewed.filter((value) => value !== slug)].slice(
    0,
    RECENT_LIMIT,
  );
  save({ ...state, recentlyViewed: next });
}

export function setPendingFavorite(slug: string | null): void {
  save({ ...loadGuestState(), pendingFavorite: slug });
}

/**
 * 認証後にアカウントへ移行し終えたら呼ぶ。
 * 端末側の一時保存を破棄する（要件15-5）。
 */
export function clearGuestState(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** 保存された条件、なければ空の条件 */
export function loadConditions(): SearchConditions {
  return loadGuestState().conditions ?? EMPTY_CONDITIONS;
}
